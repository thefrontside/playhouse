import { connectionFromArray } from 'graphql-relay';
import { Entity, parseEntityRef } from '@backstage/catalog-model';
import {
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLInterfaceType,
  GraphQLString,
  isListType,
  isNonNullType,
} from 'graphql';
import {
  DirectiveMapperAPI,
  ResolverContext,
  unboxNamedType,
  encodeId,
  isConnectionType,
  createConnectionType,
  getNodeTypeForConnection
} from '@frontside/hydraphql';
import { CATALOG_SOURCE } from './constants';

function filterEntityRefs(
  entity: Entity | undefined,
  relationType?: string,
  targetKind?: string,
): string[] {
  return (
    entity?.relations
      ?.filter(({ type }) => !relationType || type === relationType)
      .flatMap(({ targetRef }) => {
        const ref = parseEntityRef(targetRef);
        return !targetKind ||
          ref.kind.toLowerCase() === targetKind.toLowerCase()
          ? [targetRef]
          : [];
      }) ?? []
  );
}

export function relationDirectiveMapper(
  _fieldName: string,
  field: GraphQLFieldConfig<{ id: string }, ResolverContext>,
  directive: Record<string, any>,
  api: DirectiveMapperAPI,
) {
  const fieldType = field.type;
  if (
    (isListType(fieldType) && isConnectionType(fieldType.ofType)) ||
    (isNonNullType(fieldType) &&
      isListType(fieldType.ofType) &&
      isConnectionType(fieldType.ofType.ofType))
  ) {
    throw new Error(
      `It's not possible to use a list of Connection type. Use either Connection type or list of specific type`,
    );
  }
  const isList =
    isListType(fieldType) ||
    (isNonNullType(fieldType) && isListType(fieldType.ofType));

  if (isConnectionType(fieldType)) {
    if (directive.nodeType) {
      const nodeType = getNodeTypeForConnection(
        directive.nodeType,
        (name) => api.typeMap[name],
        (name, type) => (api.typeMap[name] = type),
      );

      if (nodeType) {
        field.type = createConnectionType(nodeType, fieldType);
      }
    } else {
      field.type = createConnectionType(
        api.typeMap.Node as GraphQLInterfaceType,
        fieldType,
      );
    }
    const mandatoryArgs: [string, string][] = [
      ['first', 'Int'],
      ['after', 'String'],
      ['last', 'Int'],
      ['before', 'String'],
    ];

    const fieldArgs = { ...field.args };
    mandatoryArgs.forEach(([name, type]) => {
      if (name in fieldArgs) {
        const argType = fieldArgs[name].type;
        if (
          (isNonNullType(argType)
            ? argType.ofType.toString()
            : argType.name) !== type
        ) {
          throw new Error(
            `The field has mandatory argument "${name}" with different type than expected. Expected: ${type}`,
          );
        }
      }
      fieldArgs[name] = { type: type === 'Int' ? GraphQLInt : GraphQLString };
    });
    field.args = fieldArgs;

    field.resolve = async ({ id }, args, { loader }) => {
      const ids = filterEntityRefs(
        await loader.load(id) as Entity,
        directive.name,
        directive.kind,
      ).map(ref => ({
        id: encodeId({
          source: CATALOG_SOURCE,
          typename: directive.nodeType ?? 'Node',
          query: { ref },
        }),
      }));
      return {
        ...connectionFromArray(ids, args),
        count: ids.length,
      };
    };
  } else {
    field.resolve = async ({ id }, _, { loader }) => {
      const ids = filterEntityRefs(
        await loader.load(id) as Entity,
        directive.name,
        directive.kind,
      ).map(ref => ({
        id: encodeId({
          source: CATALOG_SOURCE,
          typename: unboxNamedType(field.type).name,
          query: { ref },
        }),
      }));
      return isList ? ids : ids[0] ?? null;
    };
  }
}
