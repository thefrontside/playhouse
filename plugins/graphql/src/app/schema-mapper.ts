import { parseEntityRef } from '@backstage/catalog-model';
import {
  mapSchema,
  getDirective,
  MapperKind,
  SchemaMapper,
} from '@graphql-tools/utils';
import { GraphQLField, GraphQLFieldMap, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLTypeResolver } from 'graphql';
import { get } from 'lodash';
import { ResolverContext } from './resolver-context';

const directiveMappers: Array<(
  objectField: GraphQLField<{ id: string }, ResolverContext>,
  interfaceField: GraphQLField<{ id: string }, ResolverContext>,
  schema: GraphQLSchema
) => void> = [
  (objectField, interfaceField, schema) => {
    const fieldDirective = getDirective(schema, interfaceField ?? objectField, 'field')?.[0];
    if (!fieldDirective) return

    const fieldType = (interfaceField ?? objectField).type
    const isKeyValuePairs = fieldType instanceof GraphQLList
      && fieldType.ofType instanceof GraphQLObjectType
      && fieldType.ofType.name === 'KeyValuePair'
    objectField.resolve = async ({ id }, _, { loader }) => {
      const entity = await loader.load(id);
      if (!entity) return null;
      const fieldValue = get(entity, fieldDirective.at);
      return isKeyValuePairs && fieldValue ? Object.entries(fieldValue).map(([key, value]) => ({ key, value })) : fieldValue
    };
  },
  (objectField, interfaceField, schema) => {
    const fieldDirective = getDirective(schema, interfaceField ?? objectField, 'relation')?.[0];
    if (!fieldDirective) return

    const fieldType = (interfaceField ?? objectField).type
    const isList = fieldType instanceof GraphQLList
      || (fieldType instanceof GraphQLNonNull && fieldType.ofType instanceof GraphQLList)
    objectField.resolve = async ({ id }, _, { loader }) => {
      const entities = (await loader.load(id))
        ?.relations
        ?.filter(({ type, targetRef }) => {
          const { kind } = parseEntityRef(targetRef)
          return (
            type === (fieldDirective.type ?? objectField.name) &&
            (fieldDirective.kind ? kind === fieldDirective.kind : true)
          )
        })
        .map(({ targetRef }) => ({ id: targetRef })) ?? []
      const [entity = null] = entities

      return isList ? entities : entity
    };
  },
]

const resolveType: GraphQLTypeResolver<{ id: string }, ResolverContext> = (async ({ id }, { loader }) => {
  const entity = await loader.load(id);
  return entity?.__typeName ?? 'Never'
})

const mappers: SchemaMapper = {
  [MapperKind.UNION_TYPE]: (unionType) => {
    unionType.resolveType = unionType.resolveType ?? resolveType
    return unionType
  },
  // Define providers here
  [MapperKind.INTERFACE_TYPE]: (interfaceType) => {
    interfaceType.resolveType = interfaceType.resolveType ?? resolveType
    return interfaceType
  },
  [MapperKind.OBJECT_TYPE]: (objectType, schema) => {
    const interfaceFields = objectType
      .getInterfaces()
      .reduce(
        (fields, interfaceType) => ({
          ...fields,
          ...interfaceType.getFields(),
        }),
        {} as GraphQLFieldMap<any, any>,
      );
    Object
      .entries(objectType.getFields())
      .forEach(
        ([fieldName, fieldType]) => directiveMappers.forEach(
          mapper => mapper(fieldType, interfaceFields[fieldName], schema)
        )
      );
    return objectType;
  },
};

export const transform = (schema: GraphQLSchema) => mapSchema(schema, mappers);
