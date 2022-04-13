import {
  mapSchema,
  getDirective,
  MapperKind,
  SchemaMapper,
} from '@graphql-tools/utils';
import { GraphQLField, GraphQLFieldMap, GraphQLSchema } from 'graphql';
import { createModule, gql } from 'graphql-modules';
import { get } from 'lodash';
import { encodeId } from '../loaders';
import { ResolverContext } from '../resolver-context';

export const Directives = createModule({
  id: 'directives',
  typeDefs: gql`
    directive @field(at: String!) on FIELD_DEFINITION
    directive @hasOne(type: String!) on FIELD_DEFINITION
  `,
});

const directiveMappers: Array<(
  objectFieldType: GraphQLField<{ id: string }, ResolverContext>,
  interfaceFieldType: GraphQLField<{ id: string }, ResolverContext>,
  schema: GraphQLSchema
) => void> = [
  (objectFieldType, interfaceFieldType, schema) => {
    const fieldDirective = getDirective(schema, interfaceFieldType ?? objectFieldType, 'field')?.[0];
      if (fieldDirective) {
        objectFieldType.resolve = async ({ id }, _, { loader }) => {
          const entity = await loader.load(id);
          if (!entity) return null;
          return get(entity, fieldDirective.at);
        };
      }
  },
  (objectFieldType, interfaceFieldType, schema) => {
    const fieldDirective = getDirective(schema, interfaceFieldType ?? objectFieldType, 'hasOne')?.[0];
      if (fieldDirective) {
        objectFieldType.resolve = async ({ id }, _, { loader }) => {
          const { target } = (await loader.load(id))?.relations?.find(({ type }) => type === fieldDirective.type) ?? {}
          return target ? { id: encodeId(target) } : null
        };
      }
  }
]

const defineFieldResolvers: SchemaMapper = {
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
  mapSchema(schema, defineFieldResolvers);
