import _ from 'lodash';
import { encodeId } from '@frontside/hydraphql';
import { Resolvers } from 'graphql-modules';
import { CATALOG_SOURCE } from './constants';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { CatalogApi } from '@backstage/catalog-client';
import { Connection } from 'graphql-relay';
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
      if (!fieldDirective && !isNested) return;

      const unwrappedType = getNamedType(field.type);

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
  match: Record<string, unknown[] | Record<string, unknown[]>>,
  fieldMap: Map<string, { isLeaf: boolean; fields: Set<string> }>,
  parentKey?: string,
): (
  | { key: string; values: unknown[] }
  | { anyOf: { key: string; values: unknown[] }[] }
)[] {
  if (parentKey && fieldMap.get(parentKey)?.isLeaf) {
    const { values, fields } = match;
    const fieldKeys = [...(fieldMap.get(parentKey)?.fields ?? [])];
    return [
      ...(Array.isArray(values)
        ? [
            {
              anyOf: [
                ...fieldKeys.map(fieldKey => ({ key: fieldKey, values })),
              ],
            },
          ]
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
    if (Array.isArray(fieldValues)) {
      const fieldKeys = [...(fieldMap.get(matchKey)?.fields ?? [])];
      return [
        ...filters,
        {
          anyOf: [
            ...fieldKeys.map(fieldKey => ({
              key: fieldKey,
              values: fieldValues,
            })),
          ],
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
    | { order?: OrderDirection; fields: Record<string, OrderDirection>[] }
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
    if (typeof directionOrChild === 'string') {
      return [...(fieldMap.get(orderKey)?.fields ?? [])].map(fieldKey => ({
        field: fieldKey,
        order: directionOrChild.toLowerCase(),
      }));
    }
    if (Array.isArray(directionOrChild)) {
      return [
        ...mapOrderFieldsToQueryOrder(directionOrChild, fieldMap, orderKey),
      ];
    }
    const { fields, order } = directionOrChild;
    if (fields && order) {
      throw new Error(
        'Cannot have both "fields" and "order" in order field object',
      );
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
  search: Record<string, boolean | Record<string, boolean>>,
  fieldMap: Map<string, { isLeaf: boolean; fields: Set<string> }>,
  parentKey?: string,
): string[] {
  if (parentKey && fieldMap.get(parentKey)?.isLeaf) {
    const { include, fields } = search;
    return [
      ...(include ? fieldMap.get(parentKey)?.fields ?? [] : []),
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
    if (value === true) {
      return [...(fieldMap.get(fieldName)?.fields ?? [])];
    }
    if (typeof value === 'object') {
      return [...mapSearchFilterToTextSearch(value, fieldMap, searchKey)];
    }
    return [];
  });
}

// TODO Handle labels and annotations separately
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
        before: string;
        filter: {
          match?: Record<string, unknown>[];
          order?: Record<string, unknown>[];
          search?: { term: string, fields: Record<string, unknown>};
        };
        rawFilter: {
          filter?: { fields: unknown[] }[];
          orderFields?: { field: string; order: OrderDirection }[];
          fullTextFilter?: { term: string; fields?: string[] };
        };
      },
      { catalog }: { catalog: CatalogApi },
      { schema }: { schema: GraphQLSchema },
    ): Promise<Connection<{ id: string }>> => {
      if (filter && rawFilter) {
        throw new Error(
          'Both "filter" and "rawFilter" arguments cannot be used together',
        );
      }

      if (!fieldMap) {
        fieldMap = traverseFieldDirectives(
          schema.getType('Entity') as GraphQLCompositeType,
          schema,
        );
      }

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

      const fullTextSearch = (() => {
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

      const decodedCursor = (c =>
        c ? JSON.parse(Buffer.from(c, 'base64').toString('utf8')) : undefined)(
        after ?? before,
      );

      const cursorParams = {
        orderFields,
        fullTextSearch,
        filter: queryFilter,
      };
      const cursor = Buffer.from(
        JSON.stringify({
          orderFieldValues: [],
          ...cursorParams,
          ...decodedCursor,
          isPrevious: (first === undefined && last !== undefined) || (after === undefined && before !== undefined),
        }),
        'utf8',
      ).toString('base64');

      let limit: number | undefined = first ?? last;
      if (after) limit = first;
      if (before) limit = last;

      const orderField = cursorParams.orderFields[0]?.field;
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
      });

      // TODO Reuse field's resolvers
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
              ...cursorParams,
              ...decodedCursor,
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
