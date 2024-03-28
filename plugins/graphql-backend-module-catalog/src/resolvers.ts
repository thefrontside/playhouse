import _ from 'lodash';
import { encodeId } from '@frontside/hydraphql';
import { Resolvers } from 'graphql-modules';
import { CATALOG_SOURCE } from './constants';
import { getBearerTokenFromAuthorizationHeader } from '@backstage/plugin-auth-node';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { CatalogApi } from '@backstage/catalog-client';
import { Connection } from 'graphql-relay';
import type { Request } from 'node-fetch';
import { encodeEntityId } from './helpers';
import { getDirective } from '@graphql-tools/utils';
import {
  GraphQLCompositeType,
  GraphQLSchema,
  getNamedType,
  isCompositeType,
  isInterfaceType,
  isUnionType,
} from 'graphql';

type OrderDirection = 'ASC' | 'DESC';

interface CatalogCursor {
  firstSortFieldValues?: [string, string];
  orderFieldValues?: [string, string] | never[];
  totalItems?: number;
  isPrevious: boolean;
  orderFields?: Array<{ field: string; order: 'asc' | 'desc' }>;
  fullTextFilter?: { term: string; fields?: string[] };
  filter?: { anyOf: Array<{ allOf: { key: string; values: string[] }[] }> };
}

function parseEntityFilter(filter: { fields: unknown }[]) {
  return { anyOf: filter.map(({ fields }) => ({ allOf: fields })) };
}

function traverseFieldDirectives(
  type: GraphQLCompositeType,
  schema: GraphQLSchema,
  { isNested = false }: { isNested?: boolean } = {},
) {
  const fieldMap = new Map<string, { isLeaf: boolean; fields: Set<string> }>();
  if (isUnionType(type)) {
    type.getTypes().forEach(subType => {
      traverseFieldDirectives(subType, schema, { isNested }).forEach(
        (mappedFieldNames, childFieldName) => {
          const mappedFields = [
            ...(fieldMap.get(childFieldName)?.fields ?? []),
            ...mappedFieldNames.fields,
          ];
          fieldMap.set(childFieldName, {
            isLeaf: fieldMap.get(childFieldName)?.isLeaf ?? false,
            fields: new Set(mappedFields),
          });
        },
      );
    });
  } else {
    if (isInterfaceType(type)) {
      const { interfaces, objects } = schema.getImplementations(type);
      [...interfaces, ...objects].forEach(subType => {
        traverseFieldDirectives(subType, schema, { isNested }).forEach(
          (mappedFieldNames, childFieldName) => {
            const mappedFields = [
              ...(fieldMap.get(childFieldName)?.fields ?? []),
              ...mappedFieldNames.fields,
            ];
            fieldMap.set(childFieldName, {
              isLeaf: fieldMap.get(childFieldName)?.isLeaf ?? false,
              fields: new Set(mappedFields),
            });
          },
        );
      });
    }
    Object.entries(type.getFields()).forEach(([fieldName, field]) => {
      const [fieldDirective] = getDirective(schema, field, 'field') ?? [];
      const [resolveDirective] = getDirective(schema, field, 'resolve') ?? [];
      const [sourceTypeDirective] =
        getDirective(schema, field, 'sourceType') ?? [];
      if (!fieldDirective && !isNested || resolveDirective) return;

      const fieldType = sourceTypeDirective
        ? schema.getType(sourceTypeDirective.name)
        : field.type;
      const unwrappedType = getNamedType(fieldType);

      const mappedFieldName = fieldDirective?.at ?? fieldName;
      const fields = (fieldMap.get(fieldName)?.fields ?? new Set()).add(
        Array.isArray(mappedFieldName)
          ? mappedFieldName.join('.')
          : mappedFieldName,
      );

      if (isCompositeType(unwrappedType)) {
        fieldMap.set(fieldName, { isLeaf: false, fields });
        traverseFieldDirectives(unwrappedType, schema, {
          isNested: true,
        }).forEach((mappedFieldNames, childFieldName) => {
          const childFieldPath = `${fieldName}.${childFieldName}`;
          const mappedFields = [
            ...(fieldMap.get(childFieldPath)?.fields ?? []),
            ...[...mappedFieldNames.fields].flatMap(childMappedField =>
              [...(fieldMap.get(fieldName)?.fields ?? [])].map(
                parentMappedFieldName =>
                  `${parentMappedFieldName}.${childMappedField}`,
              ),
            ),
          ];
          fieldMap.set(childFieldPath, {
            isLeaf: fieldMap.get(childFieldName)?.isLeaf ?? false,
            fields: new Set(mappedFields),
          });
        });
      } else {
        fieldMap.set(fieldName, { isLeaf: true, fields });
      }
    });
  }

  return fieldMap;
}

function mapMatchFilterToQueryFilter(
  match: Record<string, unknown[] | { key: string; values: unknown[] }[] | Record<string, unknown[]>>,
  fieldMap: Map<string, { isLeaf: boolean; fields: Set<string> }>,
  parentKey?: string,
): (
  | { key: string; values: unknown[] }
  | { anyOf: { key: string; values: unknown[] }[] }
)[] {
  if (parentKey && fieldMap.get(parentKey)?.isLeaf) {
    const { values, rawFields, fields } = match;
    const sourceFields = [...(fieldMap.get(parentKey)?.fields ?? [])];
    return [
      ...(Array.isArray(values)
        ? [
            {
              anyOf: [
                ...sourceFields.map(fieldKey => ({ key: fieldKey, values })),
              ],
            },
          ]
        : []),
      ...(rawFields
        ? (rawFields as { key: string; values: unknown[] }[]).map(rawField => ({
            anyOf: [
              ...sourceFields.map(fieldKey => ({
                key: `${fieldKey}.${rawField.key}`,
                values: rawField.values,
              })),
            ],
          }))
        : []),
      ...(fields
        ? mapMatchFilterToQueryFilter(
            fields as Record<string, unknown[]>,
            fieldMap,
            parentKey,
          )
        : []),
    ];
  }
  return Object.entries(match).reduce((filters, [fieldName, fieldValues]) => {
    const matchKey = parentKey ? `${parentKey}.${fieldName}` : fieldName;
    const sourceFields = [...(fieldMap.get(matchKey)?.fields ?? [])]
    if (Array.isArray(fieldValues)) {
      const [firstValue] = fieldValues
      if (firstValue && typeof firstValue === 'object' && 'key' in firstValue && typeof firstValue?.key === 'string') {
        return [
          ...filters,
          ...(fieldValues as { key: string; values: unknown[] }[]).map((rawField) => ({
            anyOf: sourceFields.map(fieldKey => ({
              key: `${fieldKey}.${rawField.key}`,
              values: rawField.values
            }))
          }))
        ]
      }
      return [
        ...filters,
        {
          anyOf: sourceFields.map(fieldKey => ({
              key: fieldKey,
              values: fieldValues as unknown[],
            })),
        },
      ];
    }

    return [
      ...filters,
      ...mapMatchFilterToQueryFilter(fieldValues, fieldMap, matchKey),
    ];
  }, [] as ({ key: string; values: unknown[] } | { anyOf: { key: string; values: unknown[] }[] })[]);
}

function mapOrderFieldsToQueryOrder(
  orders: Record<
    string,
    | OrderDirection
    | { field: string; order: OrderDirection }[]
    | {
        order?: OrderDirection;
        rawFields?: { field: string; order: OrderDirection }[];
        fields?: Record<string, OrderDirection>[];
      }
    | Record<string, OrderDirection>[]
  >[],
  fieldMap: Map<string, { isLeaf: boolean; fields: Set<string> }>,
  parentKey?: string,
): { field: string; order: string }[] {
  return orders.flatMap(fieldOrder => {
    if (Object.keys(fieldOrder).length > 1) {
      throw new Error('Cannot have more than one field in order field object');
    }
    const [[fieldName, directionOrChild]] = Object.entries(fieldOrder);
    const orderKey = parentKey ? `${parentKey}.${fieldName}` : fieldName;
    const sourceFields = [...(fieldMap.get(orderKey)?.fields ?? [])];
    if (typeof directionOrChild === 'string') {
      return sourceFields.map(fieldKey => ({
        field: fieldKey,
        order: directionOrChild.toLowerCase(),
      }));
    }
    if (Array.isArray(directionOrChild)) {
      const [firstChild] = directionOrChild;
      if (
        // NOTE: isRawFields
        typeof firstChild.field === 'string' &&
        ['ASC', 'DESC'].includes(firstChild.order)
      ) {
        return [
          ...directionOrChild.flatMap(({ field, order }) =>
            sourceFields.map(fieldKey => ({
              field: `${fieldKey}.${field}`,
              order: order.toLowerCase(),
            })),
          ),
        ];
      }
      return [
        ...mapOrderFieldsToQueryOrder(
          directionOrChild as Record<string, OrderDirection>[],
          fieldMap,
          orderKey,
        ),
      ];
    }
    const { fields, rawFields, order } = directionOrChild;
    if (Object.keys(directionOrChild).length > 1) {
      throw new Error(
        'Only one of "fields", "rawFields" and "order" is allowed in order field object',
      );
    }
    if (rawFields) {
      return [
        ...rawFields.flatMap(rawField =>
          sourceFields.map(fieldKey => ({
            field: `${fieldKey}.${rawField.field}`,
            order: rawField.order.toLowerCase(),
          })),
        ),
      ];
    }
    if (fields) {
      return mapOrderFieldsToQueryOrder(fields, fieldMap, orderKey);
    }
    if (order) {
      return [...(fieldMap.get(orderKey)?.fields ?? [])].map(fieldKey => ({
        field: fieldKey,
        order: order.toLowerCase(),
      }));
    }
    return [];
  });
}

function mapSearchFilterToTextSearch(
  search: Record<
    string,
    | boolean
    | string[]
    | Record<
        string,
        {
          include?: boolean;
          rawFields?: string[];
          fields?: Record<string, boolean>;
        }
      >
    | Record<string, boolean>
  >,
  fieldMap: Map<string, { isLeaf: boolean; fields: Set<string> }>,
  parentKey?: string,
): string[] {
  if (parentKey && fieldMap.get(parentKey)?.isLeaf) {
    const { include, rawFields, fields } = search;
    const sourceFields = [...(fieldMap.get(parentKey)?.fields ?? [])];
    return [
      ...(include ? sourceFields : []),
      ...((rawFields ?? []) as string[]).flatMap(rawField =>
        sourceFields.map(fieldKey => `${fieldKey}.${rawField}`),
      ),
      ...(fields
        ? mapSearchFilterToTextSearch(
            fields as Record<string, boolean>,
            fieldMap,
            parentKey,
          )
        : []),
    ];
  }
  return Object.entries(search).flatMap(([fieldName, value]) => {
    const searchKey = parentKey ? `${parentKey}.${fieldName}` : fieldName;
    const sourceFields = [...(fieldMap.get(fieldName)?.fields ?? [])];
    if (value === true) {
      return sourceFields;
    }
    if (Array.isArray(value)) {
      return value.flatMap(rawField =>
        sourceFields.map(fieldKey => `${fieldKey}.${rawField}`),
      );
    }
    if (typeof value === 'object') {
      return [
        ...mapSearchFilterToTextSearch(
          value as Record<string, boolean>,
          fieldMap,
          searchKey,
        ),
      ];
    }
    return [];
  });
}

export const queryResolvers: () => Resolvers = () => {
  let fieldMap: Map<string, { isLeaf: boolean; fields: Set<string> }> | null =
    null;

  return {
    entity: (
      _root: any,
      {
        name,
        kind,
        namespace = 'default',
      }: { name: string; kind: string; namespace: string },
    ): { id: string } => ({
      id: encodeId({
        source: CATALOG_SOURCE,
        typename: 'Entity',
        query: { ref: stringifyEntityRef({ name, kind, namespace }) },
      }),
    }),
    entities: async (
      _root: any,
      {
        first,
        after,
        last,
        before,
        filter,
        rawFilter,
      }: {
        first?: number;
        after?: string;
        last?: number;
        before?: string;
        filter?: {
          match?: Record<string, unknown>[];
          order?: Record<string, unknown>[];
          search?: { term: string; fields: Record<string, unknown> };
        };
        rawFilter?: {
          filter?: { fields: unknown[] }[];
          orderFields?: { field: string; order: OrderDirection }[];
          fullTextFilter?: { term: string; fields?: string[] };
        };
      } = {},
      { catalog, request }: { catalog: CatalogApi, request?: Request },
      { schema }: { schema: GraphQLSchema },
    ): Promise<Connection<{ id: string }>> => {
      if (filter && rawFilter) {
        throw new Error(
          'Both "filter" and "rawFilter" arguments cannot be used together',
        );
      }

      const token = getBearerTokenFromAuthorizationHeader(request?.headers.get('authorization'));

      if (!fieldMap) {
        fieldMap = traverseFieldDirectives(
          schema.getType('Entity') as GraphQLCompositeType,
          schema,
        );
      }

      const decodedCursor = (c =>
        c ? JSON.parse(Buffer.from(c, 'base64').toString('utf8')) : undefined)(
        after ?? before,
      );

      const cursorObject: Partial<CatalogCursor> = {
        orderFieldValues: [],
      };
      if (decodedCursor) {
        Object.assign(cursorObject, decodedCursor);
      } else {
        const orderFields = (() => {
          if (rawFilter?.orderFields) {
            return rawFilter.orderFields.map(
              ({ field, order }: { field: string; order: OrderDirection }) => ({
                field,
                order: order.toLowerCase(),
              }),
            );
          }
          if (filter?.order) {
            return mapOrderFieldsToQueryOrder(
              filter.order as Record<string, OrderDirection>[],
              fieldMap,
            );
          }
          return [{ field: 'metadata.uid', order: 'asc' }];
        })();
        const fullTextFilter = (() => {
          if (rawFilter?.fullTextFilter) {
            return {
              term: rawFilter.fullTextFilter.term,
              fields: rawFilter.fullTextFilter.fields ?? undefined,
            };
          }
          if (filter?.search) {
            return {
              term: filter.search.term,
              fields: filter.search.fields
                ? mapSearchFilterToTextSearch(
                    filter.search.fields as Record<string, boolean>,
                    fieldMap,
                  )
                : undefined,
            };
          }
          return { term: '' };
        })();

        const queryFilter = (() => {
          if (rawFilter?.filter) {
            return parseEntityFilter(rawFilter.filter);
          }
          if (filter?.match) {
            return {
              anyOf: filter.match.map((match: unknown) => ({
                allOf: mapMatchFilterToQueryFilter(
                  match as Record<string, unknown[]>,
                  fieldMap!,
                ),
              })),
            };
          }
          return undefined;
        })();

        Object.assign(cursorObject, {
          orderFields,
          fullTextFilter,
          filter: queryFilter,
        });
      }
      const cursor = Buffer.from(
        JSON.stringify({
          ...cursorObject,
          isPrevious:
            (first === undefined && last !== undefined) ||
            (after === undefined && before !== undefined),
        }),
        'utf8',
      ).toString('base64');

      let limit: number | undefined = first ?? last;
      if (after) limit = first;
      if (before) limit = last;

      const orderField = cursorObject.orderFields?.[0]?.field;
      const { items, pageInfo, totalItems } = await catalog.queryEntities({
        fields: [
          'metadata.uid',
          'metadata.name',
          'metadata.namespace',
          'kind',
          ...(orderField ? [orderField] : []),
        ],
        cursor,
        limit,
      }, { token });

      // TODO Reuse field's resolvers https://github.com/thefrontside/HydraphQL/pull/22
      return {
        edges: items.map(item => ({
          cursor: Buffer.from(
            JSON.stringify({
              totalItems,
              firstSortFieldValues: [
                orderField
                  ? _.get(items[0], orderField)
                  : items[0].metadata.uid,
                items[0].metadata.uid,
              ],
              ...cursorObject,
              orderFieldValues: [
                orderField ? _.get(item, orderField) : item.metadata.uid,
                item.metadata.uid,
              ],
            }),
            'utf8',
          ).toString('base64'),
          node: { id: encodeEntityId(item) },
        })),
        pageInfo: {
          startCursor: pageInfo.prevCursor ?? undefined,
          endCursor: pageInfo.nextCursor ?? undefined,
          hasPreviousPage: Boolean(pageInfo.prevCursor),
          hasNextPage: Boolean(pageInfo.nextCursor),
        },
        count: totalItems,
      } as Connection<{ id: string }>;
    },
  };
};
