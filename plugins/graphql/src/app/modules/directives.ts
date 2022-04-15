import {
  mapSchema,
  getDirective,
  MapperKind,
  SchemaMapper,
} from '@graphql-tools/utils';
import { GraphQLField, GraphQLFieldMap, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLTypeResolver } from 'graphql';
import { createModule, gql } from 'graphql-modules';
import { get } from 'lodash';
import { encodeId } from '../loaders';
import { ResolverContext } from '../resolver-context';

export const Directives = createModule({
  id: 'directives',
  typeDefs: gql`
    directive @field(at: String!) on FIELD_DEFINITION
    directive @relation on FIELD_DEFINITION
  `,
});

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
        ?.filter(({ type }) => type === objectField.name)
        .map(({ target }) => ({ id: encodeId(target) })) ?? []
      const [entity = null] = entities

      return isList ? entities : entity
    };
  },
]

const resolveType: GraphQLTypeResolver<{ id: string }, ResolverContext> = (async ({ id }, { loader }) => {
  const entity = await loader.load(id);
  return (entity ? entity.__typeName : 'Never') ?? undefined;
})

const mappers: SchemaMapper = {
  [MapperKind.UNION_TYPE]: (unionType) => {
    unionType.resolveType = unionType.resolveType ?? resolveType
    return unionType
  },
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

export const transformer = (schema: GraphQLSchema) =>
  mapSchema(schema, mappers);
