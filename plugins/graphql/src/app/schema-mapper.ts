import { parseEntityRef } from '@backstage/catalog-model';
import {
  mapSchema,
  getDirective,
  MapperKind,
  SchemaMapper,
  addTypes,
} from '@graphql-tools/utils';
import {
  GraphQLField,
  GraphQLFieldMap,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  isObjectType
} from 'graphql';
import { pascalCase } from 'pascal-case'
import { get } from 'lodash';
import { ResolverContext } from './resolver-context';

const resolveMappers: Array<(
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

interface IncludeConfig {
  interfaceType: GraphQLInterfaceType;
  includes: string[];
}
const includeInterfaces = new Map<string, IncludeConfig>()
const mappers: SchemaMapper = {
  [MapperKind.OBJECT_TYPE]: (objectType, schema) => {
    const includes = traverseIncludes(objectType, schema)
    const interfaceDirective = getDirective(schema, objectType, 'interface')?.[0];
    if (interfaceDirective) {
      const interfaceName = interfaceDirective.name ?? `I${objectType.name}`
      includeInterfaces.set(objectType.name, {
        interfaceType: new GraphQLInterfaceType({
          name: interfaceName,
          fields: objectType.toConfig().fields,
          resolveType: getResolveTypeBy(objectType, schema)
        }),
        includes
      })
    }

    const interfaces = includes.map(type => includeInterfaces.get(type)?.interfaceType as GraphQLInterfaceType).filter(Boolean)
    const typeConfig = objectType.toConfig()
    const fieldsConfig = {
      ...interfaces.reduce((fields, interfaceType) => ({
        ...fields,
        ...interfaceType.toConfig().fields
      }), {}),
      ...typeConfig.fields,
    }
    const newObjectType = new GraphQLObjectType({
      ...typeConfig,
      fields: fieldsConfig,
      interfaces,
    })

    const interfaceFields = interfaces.reduce(
      (fields, interfaceType) => ({
        ...fields,
        ...interfaceType.getFields(),
      }),
      {} as GraphQLFieldMap<any, any>,
    );
    Object
      .entries(newObjectType.getFields())
      .forEach(
        ([fieldName, fieldType]) => resolveMappers.forEach(
          mapper => mapper(fieldType, interfaceFields[fieldName], schema)
        )
      );
    return newObjectType;
  },
};

function traverseIncludes(objectType: GraphQLObjectType, schema: GraphQLSchema): string[] {
  const includeDirective = getDirective(schema, objectType, 'include')?.[0];
  if (includeDirective) {
    let includeConfig = includeInterfaces.get(includeDirective.type)
    if (!includeConfig) {
      const includeType = schema.getType(includeDirective.type)
      if (!isObjectType(includeType)) throw new Error(`The type "${includeDirective.type}" described in @include directive for "${objectType.name}" isn't object type or doesn't exist`)

      const interfaceDirective = getDirective(schema, includeType, 'interface')?.[0];
      const interfaceName = interfaceDirective?.name ?? `I${includeType.name}`
      // TODO found field with `includeType` type
      // TODO Replace it to interface (use thunk)
      const interfaceType = new GraphQLInterfaceType({
        name: interfaceName,
        fields: includeType.toConfig().fields,
        resolveType: getResolveTypeBy(includeType, schema)
      })
      includeConfig = {
        interfaceType,
        includes: traverseIncludes(includeType, schema)
      }
      includeInterfaces.set(includeType.name, includeConfig)
    }
    return [...includeConfig.includes, objectType.name]
  }
  return [objectType.name]
}

function getResolveTypeBy(objectType: GraphQLObjectType, schema: GraphQLSchema) {
  const resolveDirective = getDirective(schema, objectType, 'resolve')?.[0];
  return async ({ id }: { id: string }, { loader }: ResolverContext) => {
    const entity = await loader.load(id);
    return pascalCase(get(entity, resolveDirective?.by ?? 'kind') ?? 'Never')
  }
}

export const transform = (schema: GraphQLSchema) => {
  return addTypes(
    mapSchema(mapSchema(schema, mappers), {
      [MapperKind.UNION_TYPE]: (unionType) => {
        if (unionType.resolveType) return unionType
        const interfaces = new Map<string, GraphQLInterfaceType>()
        unionType
          .getTypes()
          .forEach(
            type => type
              .getInterfaces()
              .forEach(iface => interfaces.set(iface.name, iface))
          )
        console.log(interfaces)
        // TODO How to resolve union types?
        // unionType.resolveType =
        // unionType.getTypes()[0].getInterfaces()[0].resolveType
        // unionType.resolveType = unionType.resolveType ?? resolveType
        // // TODO Get types => get interfaces => use resolveType
        return unionType
      },
      [MapperKind.OBJECT_FIELD]: (fieldType, _fieldName, typeName) => {
        const iface = includeInterfaces.get(typeName)
        if (iface) {
          // TODO Replace field type to interface
        }
        return fieldType
      }
    }),
    [...includeInterfaces.values()].map(({ interfaceType: interfaceType }) => interfaceType)
  )
};
