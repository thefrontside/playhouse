import {
  GraphQLSchema,
  isInterfaceType,
  isInputObjectType,
  GraphQLInputObjectType,
  isEnumType,
  GraphQLBoolean,
  GraphQLEnumType,
  isUnionType,
  GraphQLCompositeType,
  getNamedType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLInputType,
  GraphQLType,
  isLeafType,
  isWrappingType,
  isCompositeType,
} from 'graphql';
import { addTypes, getDirective } from '@graphql-tools/utils';
import GraphQLJSON from 'graphql-type-json';

export function isWrappingLeafType(type: GraphQLType): boolean {
  if (isLeafType(type)) return true
  if (isWrappingType(type)) return isWrappingLeafType(type.ofType)
  return false
}

export function isWrappingCompositeType(type: GraphQLType): boolean {
  if (isCompositeType(type)) return true
  if (isWrappingType(type)) return isWrappingCompositeType(type.ofType)
  return false
}

function mergeLeafAndCompositeOrderFieldTypes(
  fieldName: string,
  orderFieldTypeName: string,
  compositeOrderFieldType: GraphQLInputType,
  orderType: GraphQLEnumType,
) {
  // NOTE: Should we check if the type is already in the schema?
  return {
    type: new GraphQLInputObjectType({
      name: `${orderFieldTypeName}_${fieldName[0].toUpperCase()}${fieldName.slice(
        1,
      )}`,
      fields: {
        order: { type: orderType },
        fields: {
          type: new GraphQLList(
            new GraphQLNonNull(
              new GraphQLInputObjectType({
                ...(
                  getNamedType(
                    compositeOrderFieldType,
                  ) as GraphQLInputObjectType
                ).toConfig(),
                name: `${orderFieldTypeName}__${fieldName[0].toUpperCase()}${fieldName.slice(
                  1,
                )}`,
              }),
            ),
          ),
        },
      },
    }),
  };
}

function mergeLeafAndCompositeTextFilterFieldsTypes(
  fieldName: string,
  textFilterFieldsTypeName: string,
  compositeTextFilterFieldsType: GraphQLInputType,
) {
  return {
    type: new GraphQLInputObjectType({
      name: `${textFilterFieldsTypeName}_${fieldName[0].toUpperCase()}${fieldName.slice(
        1,
      )}`,
      fields: {
        include: { type: GraphQLBoolean },
        fields: {
          type: new GraphQLInputObjectType({
            ...(
              getNamedType(
                compositeTextFilterFieldsType,
              ) as GraphQLInputObjectType
            ).toConfig(),
            name: `${textFilterFieldsTypeName}__${fieldName[0].toUpperCase()}${fieldName.slice(
              1,
            )}`,
          }),
        },
      },
    }),
  };
}

function mergeLeafAndCompositeFilterExpressionTypes(
  fieldName: string,
  filterExpressionTypeName: string,
  compositeFilterExpressionType: GraphQLInputType,
) {
  return {
    type: new GraphQLInputObjectType({
      name: `${filterExpressionTypeName}_${fieldName[0].toUpperCase()}${fieldName.slice(
        1,
      )}`,
      fields: {
        values: { type: new GraphQLList(new GraphQLNonNull(GraphQLJSON)) },
        fields: {
          type: new GraphQLInputObjectType({
            ...(
              getNamedType(
                compositeFilterExpressionType,
              ) as GraphQLInputObjectType
            ).toConfig(),
            name: `${filterExpressionTypeName}__${fieldName[0].toUpperCase()}${fieldName.slice(
              1,
            )}`,
          }),
        },
      },
    }),
  };
}

function getTypeConfigs(
  fieldName: string,
  fieldTypes: Map<string, { isLeaf?: boolean; isComposite?: boolean }>,
  orderFieldTypeConfig: ReturnType<GraphQLInputObjectType['toConfig']>,
  textFilterFieldsTypeConfig: ReturnType<GraphQLInputObjectType['toConfig']>,
  filterExpressionTypeConfig: ReturnType<GraphQLInputObjectType['toConfig']>,
) {
  if (fieldTypes.get(fieldName)?.isComposite) {
    if (fieldTypes.get(fieldName)?.isLeaf) {
      const mixedOrderFieldType = orderFieldTypeConfig.fields[fieldName]
        .type as GraphQLInputObjectType;
      const mixedTextFilterFieldsType = textFilterFieldsTypeConfig.fields[
        fieldName
      ].type as GraphQLInputObjectType;
      const mixedFilterExpressionType = filterExpressionTypeConfig.fields[
        fieldName
      ].type as GraphQLInputObjectType;

      return {
        // {
        //   order: OrderDirection
        //   fields: [EntityOrderField${FieldName}!]
        // }
        compositeOrderFieldTypeConfig: (
          getNamedType(
            mixedOrderFieldType.toConfig().fields.fields.type,
          ) as GraphQLInputObjectType
        ).toConfig(),
        // {
        //   include: Boolean
        //   fields: EntityTextFilterFields${FieldName}
        // }
        compositeTextFilterFieldsTypeConfig: (
          getNamedType(
            mixedTextFilterFieldsType.toConfig().fields.fields.type,
          ) as GraphQLInputObjectType
        ).toConfig(),
        // {
        //   values: JSON
        //   fields: [EntityFilterExpression${FieldName}!]
        // }
        compositeFilterExpressionTypeConfig: (
          getNamedType(
            mixedFilterExpressionType.toConfig().fields.fields.type,
          ) as GraphQLInputObjectType
        ).toConfig(),
      };
    }
    return {
      compositeOrderFieldTypeConfig: (
        getNamedType(
          orderFieldTypeConfig.fields[fieldName].type,
        ) as GraphQLInputObjectType
      ).toConfig(),
      compositeTextFilterFieldsTypeConfig: (
        getNamedType(
          textFilterFieldsTypeConfig.fields[fieldName].type,
        ) as GraphQLInputObjectType
      ).toConfig(),
      compositeFilterExpressionTypeConfig: (
        getNamedType(
          filterExpressionTypeConfig.fields[fieldName].type,
        ) as GraphQLInputObjectType
      ).toConfig(),
    };
  }
  return {
    compositeOrderFieldTypeConfig: {
      name: `${
        orderFieldTypeConfig.name
      }_${fieldName[0].toUpperCase()}${fieldName.slice(1)}`,
      fields: {},
    } as ReturnType<GraphQLInputObjectType['toConfig']>,
    compositeTextFilterFieldsTypeConfig: {
      name: `${
        textFilterFieldsTypeConfig.name
      }_${fieldName[0].toUpperCase()}${fieldName.slice(1)}`,
      fields: {},
    } as ReturnType<GraphQLInputObjectType['toConfig']>,
    compositeFilterExpressionTypeConfig: {
      name: `${
        filterExpressionTypeConfig.name
      }_${fieldName[0].toUpperCase()}${fieldName.slice(1)}`,
      fields: {},
    } as ReturnType<GraphQLInputObjectType['toConfig']>,
  };
}

function processTypes(
  schema: GraphQLSchema,
  types: readonly GraphQLCompositeType[],
  {
    isNested = false,
    orderDirectionType,
    orderFieldTypeConfig,
    textFilterFieldsTypeConfig,
    filterExpressionTypeConfig,
  }: {
    isNested?: boolean;
    orderDirectionType: GraphQLEnumType;
    orderFieldTypeConfig: ReturnType<GraphQLInputObjectType['toConfig']>;
    textFilterFieldsTypeConfig: ReturnType<GraphQLInputObjectType['toConfig']>;
    filterExpressionTypeConfig: ReturnType<GraphQLInputObjectType['toConfig']>;
  },
) {
  const fieldTypes = new Map<
    string,
    { isLeaf?: boolean; isComposite?: boolean }
  >();

  types.forEach(type => {
    if (isUnionType(type)) {
      processTypes(schema, type.getTypes(), {
        isNested,
        orderDirectionType,
        orderFieldTypeConfig,
        textFilterFieldsTypeConfig,
        filterExpressionTypeConfig,
      });
      return;
    }
    if (isInterfaceType(type)) {
      processTypes(schema, [...schema.getImplementations(type).interfaces, ...schema.getImplementations(type).objects], {
        isNested,
        orderDirectionType,
        orderFieldTypeConfig,
        textFilterFieldsTypeConfig,
        filterExpressionTypeConfig,
      });
    }
    Object.entries(type.getFields()).forEach(([fieldName, field]) => {
      const [fieldDirective] = getDirective(schema, field, 'field') ?? [];
      const [excludeFromFilter] = getDirective(schema, field, 'excludeFromFilter') ?? []
      if (!fieldDirective && !isNested || excludeFromFilter) return;

      // const sourceFieldName = fieldDirective.at ?? fieldName

      if (
        isWrappingLeafType(field.type) &&
        !fieldTypes.get(fieldName)?.isLeaf
      ) {
        if (fieldTypes.get(fieldName)?.isComposite) {
          // NOTE: Should we check if the type is already in the schema?
          orderFieldTypeConfig.fields[fieldName] =
            mergeLeafAndCompositeOrderFieldTypes(
              fieldName,
              orderFieldTypeConfig.name,
              orderFieldTypeConfig.fields[fieldName].type,
              orderDirectionType,
            );

          textFilterFieldsTypeConfig.fields[fieldName] =
            mergeLeafAndCompositeTextFilterFieldsTypes(
              fieldName,
              textFilterFieldsTypeConfig.name,
              textFilterFieldsTypeConfig.fields[fieldName].type,
            );

          filterExpressionTypeConfig.fields[fieldName] =
            mergeLeafAndCompositeFilterExpressionTypes(
              fieldName,
              filterExpressionTypeConfig.name,
              filterExpressionTypeConfig.fields[fieldName].type,
            );
        } else {
          orderFieldTypeConfig.fields[fieldName] = { type: orderDirectionType };
          textFilterFieldsTypeConfig.fields[fieldName] = {
            type: GraphQLBoolean,
          };
          // NOTE: Should we handle enums differently?
          filterExpressionTypeConfig.fields[fieldName] = {
            type: new GraphQLList(new GraphQLNonNull(GraphQLJSON)),
          };
        }

        fieldTypes.set(fieldName, { isLeaf: true });
      }

      if (isWrappingCompositeType(field.type)) {
        const fieldType = getNamedType(field.type) as GraphQLCompositeType;

        const {
          compositeOrderFieldTypeConfig,
          compositeTextFilterFieldsTypeConfig,
          compositeFilterExpressionTypeConfig,
        } = getTypeConfigs(
          fieldName,
          fieldTypes,
          orderFieldTypeConfig,
          textFilterFieldsTypeConfig,
          filterExpressionTypeConfig,
        );

        processTypes(schema, [fieldType], {
          isNested: true,
          orderDirectionType,
          orderFieldTypeConfig: compositeOrderFieldTypeConfig,
          textFilterFieldsTypeConfig: compositeTextFilterFieldsTypeConfig,
          filterExpressionTypeConfig: compositeFilterExpressionTypeConfig,
        });

        if (fieldTypes.get(fieldName)?.isLeaf) {
          orderFieldTypeConfig.fields[fieldName] =
            mergeLeafAndCompositeOrderFieldTypes(
              fieldName,
              orderFieldTypeConfig.name,
              new GraphQLInputObjectType(compositeOrderFieldTypeConfig),
              orderDirectionType,
            );

          textFilterFieldsTypeConfig.fields[fieldName] =
            mergeLeafAndCompositeTextFilterFieldsTypes(
              fieldName,
              textFilterFieldsTypeConfig.name,
              new GraphQLInputObjectType(compositeTextFilterFieldsTypeConfig),
            );

          filterExpressionTypeConfig.fields[fieldName] =
            mergeLeafAndCompositeFilterExpressionTypes(
              fieldName,
              filterExpressionTypeConfig.name,
              new GraphQLInputObjectType(compositeFilterExpressionTypeConfig),
            );
        } else {
          orderFieldTypeConfig.fields[fieldName] = {
            type: new GraphQLList(
              new GraphQLNonNull(
                new GraphQLInputObjectType(compositeOrderFieldTypeConfig),
              ),
            ),
          };
          textFilterFieldsTypeConfig.fields[fieldName] = {
            type: new GraphQLInputObjectType(
              compositeTextFilterFieldsTypeConfig,
            ),
          };
          filterExpressionTypeConfig.fields[fieldName] = {
            type: new GraphQLInputObjectType(compositeFilterExpressionTypeConfig),
          };
        }

        fieldTypes.set(fieldName, { isComposite: true });
      }
    });
  });
}

// TODO Handle `JSONObject` type
export function generateEntitiesQueryInputTypes(
  schema: GraphQLSchema,
): GraphQLSchema {
  const entityType = schema.getType('Entity');
  if (!entityType || !isInterfaceType(entityType)) return schema;

  const orderFieldType = schema.getType('EntityOrderField');

  if (!orderFieldType || !isInputObjectType(orderFieldType)) {
    throw new Error('"EntityOrderField" type not found or isn\'t input type');
  }
  const orderFieldTypeConfig = orderFieldType.toConfig();
  orderFieldTypeConfig.fields = {};

  const orderDirectionType = schema.getType('OrderDirection');
  if (!orderDirectionType || !isEnumType(orderDirectionType)) {
    throw new Error('"OrderDirection" type not found or isn\'t enum type');
  }

  const textFilterFieldsType = schema.getType('EntityTextFilterFields');
  if (!textFilterFieldsType || !isInputObjectType(textFilterFieldsType)) {
    throw new Error(
      '"EntityTextFilterFields" type not found or isn\'t input type',
    );
  }
  const textFilterFieldsTypeConfig = textFilterFieldsType.toConfig();
  textFilterFieldsTypeConfig.fields = {};

  const filterExpressionType = schema.getType('EntityFilterExpression');
  if (!filterExpressionType || !isInputObjectType(filterExpressionType)) {
    throw new Error(
      '"EntityFilterExpression" type not found or isn\'t input type',
    );
  }
  const filterExpressionTypeConfig = filterExpressionType.toConfig();
  filterExpressionTypeConfig.fields = {};

  processTypes(schema, [entityType], {
    orderDirectionType,
    orderFieldTypeConfig,
    textFilterFieldsTypeConfig,
    filterExpressionTypeConfig,
  });

  if (!Object.keys(orderFieldTypeConfig.fields).length) {
    orderFieldTypeConfig.fields = {
      _dummy: { type: orderDirectionType },
    }
  }

  if (!Object.keys(textFilterFieldsTypeConfig.fields).length) {
    textFilterFieldsTypeConfig.fields = {
      _dummy: { type: GraphQLBoolean },
    }
  }

  if (!Object.keys(filterExpressionTypeConfig.fields).length) {
    filterExpressionTypeConfig.fields = {
      _dummy: { type: new GraphQLList(new GraphQLNonNull(GraphQLJSON)) },
    }
  }

  return addTypes(schema, [
    new GraphQLInputObjectType(orderFieldTypeConfig),
    new GraphQLInputObjectType(textFilterFieldsTypeConfig),
    new GraphQLInputObjectType(filterExpressionTypeConfig),
  ]);
}
