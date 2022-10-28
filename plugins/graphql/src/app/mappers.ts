import { get } from 'lodash';
import { connectionFromArray } from 'graphql-relay';
import { Entity, parseEntityRef } from '@backstage/catalog-model';
import { getDirective, MapperKind, addTypes, mapSchema, getImplementingTypes } from '@graphql-tools/utils';
import {
  GraphQLFieldConfig,
  GraphQLFieldConfigMap,
  GraphQLInt,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLOutputType,
  GraphQLSchema,
  GraphQLString,
  GraphQLUnionType,
  isInterfaceType,
  isListType,
  isNonNullType,
  isUnionType,
} from 'graphql';
import type { ResolverContext } from './types';

function filterEntities(entity: Entity | undefined, relationName: string, targetKind?: string): { id: string }[] {
  return entity
    ?.relations
    ?.filter(({ type, targetRef }) => {
      const { kind } = parseEntityRef(targetRef)
      return type === relationName && (targetKind ? kind.toLowerCase() === targetKind.toLowerCase() : true)
    })
    .map(({ targetRef }) => ({ id: targetRef })) ?? [];
}

function isConnectionType(type: unknown): type is GraphQLInterfaceType {
  return isInterfaceType(type) && type.name === 'Connection'
  || isNonNullType(type) && isConnectionType(type.ofType);
}

function createConnectionType(fieldType: GraphQLInterfaceType, typeName: string, schema: GraphQLSchema): GraphQLObjectType {
  const wrappedEdgeType = fieldType.getFields().edges.type as GraphQLNonNull<GraphQLList<GraphQLNonNull<GraphQLInterfaceType>>>
  const edgeType = wrappedEdgeType.ofType.ofType.ofType as GraphQLInterfaceType
  const nodeType = schema.getType(typeName)

  if (!nodeType) {
    throw new Error(`The type "${typeName}" is not defined in the schema.`)
  }
  return new GraphQLObjectType({
    name: `${typeName}Connection`,
    fields: {
      ...fieldType.toConfig().fields,
      edges: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(new GraphQLObjectType({
          name: `${typeName}Edge`,
          fields: {
            ...edgeType.toConfig().fields,
            node: {
              type: new GraphQLNonNull(nodeType as GraphQLOutputType),
            }
          },
          interfaces: [edgeType]
        }))))
      }
    },
    interfaces: [fieldType]
  })
}

const resolveMappers: Record<'field' | 'relation', (
  field: GraphQLFieldConfig<{ id: string }, ResolverContext>,
  fieldName: string,
  directive: Record<string, any>,
  schema: GraphQLSchema
) => void> = {
  field: (field, _, directive) => {
    if (typeof directive.at !== 'string' || (Array.isArray(directive.at) && directive.at.every(a => typeof a !== 'string'))) {
      throw new Error(`The "at" argument of @field directive must be a string or an array of strings`);
    }
    field.resolve = async ({ id }, _, { loader }) => {
      const entity = await loader.load(id);
      if (!entity) return null;
      return get(entity, directive.at);
    };
  },
  relation: (field, fieldName, directive, schema) => {
    const fieldType = field.type;
    if (
      isListType(fieldType) && isConnectionType(fieldType.ofType)
      || isNonNullType(fieldType) && isListType(fieldType.ofType) && isConnectionType(fieldType.ofType.ofType)
      ) {
        throw new Error(`It's not possible to use a list of Connection type. Use either Connection type or list of specific type`)
      }
    const isList = isListType(fieldType) || (isNonNullType(fieldType) && isListType(fieldType.ofType))

    if (isConnectionType(fieldType)) {
      if (directive.type) {
        const nodeType = schema.getType(directive.type)

        if (!nodeType) {
          throw new Error(`The type "${directive.type}" is not defined in the schema.`)
        }
        if (isUnionType(nodeType)) {
          field.type = new GraphQLUnionType({
            name: `${directive.type}Connection`,
            types: nodeType.getTypes().map(type => createConnectionType(fieldType, type.name, schema)),
          })
        } else {
          field.type = createConnectionType(fieldType, directive.type, schema)
        }
      }
      const mandatoryArgs: [string, string][] = [
        ['first', 'Int'],
        ['after', 'String'],
        ['last', 'Int'],
        ['before', 'String'],
      ]

      const args = { ...field.args }
      mandatoryArgs.forEach(([name, type]) => {
        if (name in args) {
          const argType = args[name].type
          if ((isNonNullType(argType) ? argType.ofType.toString() : argType.name) !== type) {
            throw new Error(`The field has mandatory argument "${name}" with different type than expected. Expected: ${type}`)
          }
        }
        args[name] = { type: type === 'Int' ? GraphQLInt : GraphQLString }
      })
      field.args = args

      field.resolve = async ({ id }, args, { loader }) => {
        const entities = filterEntities(await loader.load(id), directive.name ?? fieldName, directive.kind);
        return connectionFromArray(entities, args);
      };
    } else {
      field.resolve = async ({ id }, _, { loader }) => {
        const entities = filterEntities(await loader.load(id), directive.name ?? fieldName, directive.kind);
        return isList ? entities : entities[0] ?? null;
      }
    }
  },
}

export function transformDirectives(schema: GraphQLSchema) {
  const implementedTypes: GraphQLObjectType[] = [];
  return mapSchema(addTypes(mapSchema(schema, {
    [MapperKind.INTERFACE_TYPE]: (interfaceType, schema) => {
      const interfaces = traverseExtends(interfaceType, schema)
      const fields = [...interfaces].reverse().reduce((acc, type) => ({ ...acc, ...type.toConfig().fields }), { } as GraphQLFieldConfigMap<any, any>)

      Object
        .keys(fields)
        .forEach(
          (fieldName) => {
            const field = fields[fieldName];
            const [fieldDirective] = getDirective(schema, field, 'field') ?? []
            const [relationDirective] = getDirective(schema, field, 'relation') ?? []

            const typeName = [interfaceType, ...interfaces].find(type => Object.keys(type.toConfig().fields).find(name => name === fieldName))?.name as string

            if (fieldDirective && relationDirective) {
              throw new Error(`The field "${fieldName}" of "${typeName}" type has both @field and @relation directives at the same time`)
            }

            try {
              if (fieldDirective) {
                resolveMappers.field(field, fieldName, fieldDirective, schema)
              } else if (relationDirective) {
                resolveMappers.relation(field, fieldName, relationDirective, schema)
              } else {
                return
              }
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : error
              throw new Error(`Error while processing directives on field "${fieldName}" of "${typeName}":\n${errorMessage}`)
            }
          }
        );
      const { astNode, extensionASTNodes, ...typeConfig } = interfaceType.toConfig();

      implementedTypes.push(new GraphQLObjectType({ ...typeConfig, name: `${interfaceType.name}Impl`, fields, interfaces }))

      return new GraphQLInterfaceType({ ...typeConfig, fields, interfaces: interfaces.filter(iface => iface.name !== interfaceType.name) });
    }
  }), implementedTypes), {
    [MapperKind.UNION_TYPE]: (unionType, schema) => {
      const typeConfig = unionType.toConfig()
      typeConfig.types = typeConfig.types.flatMap(type => {
        if (isInterfaceType(type)) {
          return getImplementingTypes((type as GraphQLInterfaceType).name, schema).map(name => schema.getType(name) as GraphQLObjectType)
        }
        return [type]
      })
      return new GraphQLUnionType(typeConfig)
    }
  })
}

function traverseExtends(type: GraphQLInterfaceType, schema: GraphQLSchema): GraphQLInterfaceType[] {
  const [extendDirective] = getDirective(schema, type, 'extend') ?? []
  const interfaces = [type, ...type.getInterfaces()]
  if (extendDirective) {
    let extendType = schema.getType(extendDirective.type)
    if (!isInterfaceType(extendType)) {
      throw new Error(`"${extendDirective.type}" type described in @extend directive for "${type.name}" isn't abstract type or doesn't exist`)
    }
    if (interfaces.includes(extendType)) {
      throw new Error(`The interface "${extendDirective.type}" described in @extend directive for "${type.name}" is already implemented`)
    }
    if ('when' in extendDirective !== 'is' in extendDirective) {
      throw new Error(`The @extend directive of "${extendDirective.type}" should have both "when" and "is" arguments or none of them`)
    }
    if ('when' in extendDirective && (typeof extendDirective.when !== 'string' || (Array.isArray(extendDirective.when) && extendDirective.when.some(a => typeof a !== 'string')))) {
      throw new Error(`The "when" argument of @extend directive should be a string or an array of strings`)
    }

    const { resolveType } = extendType
    extendType.resolveType = async ({ id }, { loader }, info, abstractType) => {
      const entity = await loader.load(id)
      if (!entity) return undefined
      if ('when' in extendDirective && 'is' in extendDirective && get(entity, extendDirective.when) === extendDirective.is) {
        return `${type.name}Impl`
      }
      const resolvedType = await resolveType?.({ id }, { loader }, info, abstractType) ?? null
      if (resolvedType) return resolvedType
      if (extendType?.name === entity.kind) return `${entity.kind}Impl`
      return entity.kind
    }

    interfaces.push(...traverseExtends(extendType, schema))
  }
  return interfaces
}
