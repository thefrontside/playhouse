import { parseEntityRef } from '@backstage/catalog-model';
import {
  mapSchema,
  getDirective,
  MapperKind,
  SchemaMapper,
  addTypes,
  getImplementingTypes,
} from '@graphql-tools/utils';
import {
  GraphQLAbstractType,
  GraphQLEnumType,
  GraphQLField,
  GraphQLFieldConfigMap,
  GraphQLFieldMap,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLOutputType,
  GraphQLResolveInfo,
  GraphQLScalarType,
  GraphQLSchema,
  GraphQLUnionType,
  isListType,
  isNonNullType,
  isObjectType,
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

interface ExtendConfig {
  interfaceType: GraphQLInterfaceType;
  extenders: string[];
}
const extendInterfaces = new Map<string, ExtendConfig>()
const objectMapper: SchemaMapper = {
  [MapperKind.OBJECT_TYPE]: (objectType, schema) => {
    const extenders = traverseExtends(objectType, schema)
    const interfaces = extenders.map(type => extendInterfaces.get(type)?.interfaceType as GraphQLInterfaceType).filter(Boolean)
    const typeConfig = objectType.toConfig()
    const fieldsConfig: GraphQLFieldConfigMap<any, any> = {
      ...interfaces.reduce((fields, interfaceType) => ({
        ...fields,
        ...interfaceType.toConfig().fields
      }), {}),
      ...typeConfig.fields,
    }
    Object.values(fieldsConfig).forEach((fieldConfig) => {
      const [fieldType, recreateType] = resolveFieldType(fieldConfig.type)
      const { interfaceType } = extendInterfaces.get(fieldType.name) ?? {}
      if (interfaceType) {
        fieldConfig.type = recreateType(interfaceType)
      }
    })
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
const unionMapper: SchemaMapper = {
  [MapperKind.UNION_TYPE]: (unionType, schema) => {
    if (unionType.resolveType) return unionType
    const implementedTypes = new Set<string>()
    const commonTypes = unionType.getTypes().reduce((types: null | string[], objectType) => {
      const extenders = traverseExtends(objectType, schema)
      const interfaceName = extendInterfaces.get(objectType.name)?.interfaceType.name
      if (interfaceName) getImplementingTypes(interfaceName, schema).forEach(typeName => implementedTypes.add(typeName))
      if (!types) return extenders
      return extenders.filter(type => types.includes(type))
    }, null)
    if (!commonTypes || commonTypes.length === 0) return unionType
    const { resolveType } = extendInterfaces.get(commonTypes[0])?.interfaceType ?? {}
    const unionTypeConfig = unionType.toConfig()
    const resolvedTypes = [...implementedTypes.values()].map(typeName => schema.getType(typeName) as GraphQLObjectType)
    return new GraphQLUnionType({
      ...unionTypeConfig,
      resolveType,
      types: [...new Set([...unionTypeConfig.types, ...resolvedTypes])]
    })
  }
}

function resolveFieldType(fieldType: GraphQLOutputType): [GraphQLScalarType | GraphQLObjectType | GraphQLInterfaceType | GraphQLUnionType | GraphQLEnumType, (type: GraphQLOutputType) => GraphQLOutputType] {
  if (isNonNullType(fieldType)) {
    const [resolvedType, recreateType] = resolveFieldType(fieldType.ofType)
    return [resolvedType, (type) => new GraphQLNonNull(recreateType(type))]
  }
  if (isListType(fieldType)) {
    const [resolvedType, recreateType] = resolveFieldType(fieldType.ofType)
    return [resolvedType, (type) => new GraphQLList(recreateType(type))]
  }
  return [fieldType, (type) => type]
}

function createExtendConfig(
  extendType: GraphQLObjectType,
  extenders: string[],
  schema: GraphQLSchema
) {
  const interfaceDirective = getDirective(schema, extendType, 'interface')?.[0];
  const interfaceName = interfaceDirective?.name ?? `I${extendType.name}`
  const fields = extendType.toConfig().fields
  const interfaceType = new GraphQLInterfaceType({
    name: interfaceName,
    fields: () => {
      Object.values(fields).forEach((fieldConfig) => {
        const [fieldType, recreateType] = resolveFieldType(fieldConfig.type)
        const { interfaceType: ifaceType } = extendInterfaces.get(fieldType.name) ?? {}
        if (ifaceType) {
          fieldConfig.type = recreateType(ifaceType)
        }
      })
      return fields
    },
    resolveType: getResolveTypeBy(extendType, schema)
  })
  const extendConfig = {
    interfaceType,
    extenders,
  }
  extendInterfaces.set(extendType.name, extendConfig)
  return extendConfig
}

function traverseExtends(objectType: GraphQLObjectType, schema: GraphQLSchema): string[] {
  const extendDirective = getDirective(schema, objectType, 'extend')?.[0];
  if (extendDirective) {
    let extendConfig = extendInterfaces.get(extendDirective.type)
    if (!extendConfig) {
      const extendType = schema.getType(extendDirective.type)
      if (!isObjectType(extendType)) throw new Error(`The type "${extendDirective.type}" described in @extend directive for "${objectType.name}" isn't object type or doesn't exist`)

      extendConfig = createExtendConfig(extendType, traverseExtends(extendType, schema), schema)
    }
    return [...extendConfig.extenders, objectType.name]
  }
  return [objectType.name]
}

function getResolveTypeBy(objectType: GraphQLObjectType, schema: GraphQLSchema) {
  const resolveDirective = getDirective(schema, objectType, 'resolve')?.[0];
  if (!resolveDirective) return undefined;
  return async (
    { id, parentName = objectType.name }: { id: string, parentName?: string },
    context: ResolverContext,
    info: GraphQLResolveInfo,
    abstractType: GraphQLAbstractType
  ) => {
    const normalizedParentName = parentName === 'Entity' || parentName === 'Node' ? '' : parentName
    const entity = await context.loader.load(id);
    const typeName = pascalCase(get(entity, resolveDirective.by) ?? 'Never').replace(new RegExp(`${normalizedParentName}$`, 'gi'), '')
    const resolvedType = await extendInterfaces
    .get(typeName)
    ?.interfaceType
    .resolveType
    ?.({ id, parentName: typeName }, context, info, abstractType)
    return resolvedType ?? `${typeName}${normalizedParentName}`
  }
}

export const transform = (schema: GraphQLSchema) => {
  // NOTE Traverse through all `@extend` directives and create necessary interfaces
  mapSchema(schema, {
    [MapperKind.OBJECT_TYPE]: (objectType) => {
      const extenders = traverseExtends(objectType, schema)
      const interfaceDirective = getDirective(schema, objectType, 'interface')?.[0];
      if (interfaceDirective) {
        createExtendConfig(objectType, extenders, schema)
      }
      return objectType
    }
  })

  return addTypes(
    mapSchema(mapSchema(schema, objectMapper), unionMapper),
    [...extendInterfaces.values()].map(({ interfaceType: interfaceType }) => interfaceType)
  )
};
