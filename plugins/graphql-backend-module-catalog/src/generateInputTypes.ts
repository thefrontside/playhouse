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
  isLeafType,
  isCompositeType,
  GraphQLInputFieldConfig,
  GraphQLString,
  GraphQLNamedType,
} from 'graphql';
import { addTypes, getDirective } from '@graphql-tools/utils';
import GraphQLJSON from 'graphql-type-json';

interface TypeParams {
  isLeaf?: boolean;
  isComposite?: boolean;
  isJsonObject?: boolean;
}

function isJsonObject(type: GraphQLNamedType) {
  return type.name === 'JSONObject';
}

function createCompositeOrderFieldsType(
  fieldName: string,
  orderFieldTypeName: string,
  compositeOrderFieldType: GraphQLInputType,
) {
  return {
    type: new GraphQLList(
      new GraphQLNonNull(
        new GraphQLInputObjectType({
          ...(
            getNamedType(compositeOrderFieldType) as GraphQLInputObjectType
          ).toConfig(),
          name: `${orderFieldTypeName}__${fieldName[0].toUpperCase()}${fieldName.slice(
            1,
          )}`,
        }),
      ),
    ),
  };
}

function createCompositeTextFilterFieldsType(
  fieldName: string,
  textFilterFieldsTypeName: string,
  compositeTextFilterFieldsType: GraphQLInputType,
) {
  return {
    type: new GraphQLInputObjectType({
      ...(
        getNamedType(compositeTextFilterFieldsType) as GraphQLInputObjectType
      ).toConfig(),
      name: `${textFilterFieldsTypeName}__${fieldName[0].toUpperCase()}${fieldName.slice(
        1,
      )}`,
    }),
  };
}

function createCompositeFilterExpressionType(
  fieldName: string,
  filterExpressionTypeName: string,
  compositeFilterExpressionType: GraphQLInputType,
) {
  return {
    type: new GraphQLInputObjectType({
      ...(
        getNamedType(compositeFilterExpressionType) as GraphQLInputObjectType
      ).toConfig(),
      name: `${filterExpressionTypeName}__${fieldName[0].toUpperCase()}${fieldName.slice(
        1,
      )}`,
    }),
  };
}

function mergeLeafAndCompositeOrderFieldTypes(
  fieldName: string,
  orderFieldTypeName: string,
  fields: Record<string, GraphQLInputFieldConfig>,
) {
  // NOTE: Should we check if the type is already in the schema?
  return {
    type: new GraphQLInputObjectType({
      name: `${orderFieldTypeName}_${fieldName[0].toUpperCase()}${fieldName.slice(
        1,
      )}`,
      fields,
    }),
  };
}

function mergeLeafAndCompositeTextFilterFieldsTypes(
  fieldName: string,
  textFilterFieldsTypeName: string,
  fields: Record<string, GraphQLInputFieldConfig>,
) {
  return {
    type: new GraphQLInputObjectType({
      name: `${textFilterFieldsTypeName}_${fieldName[0].toUpperCase()}${fieldName.slice(
        1,
      )}`,
      fields,
    }),
  };
}

function mergeLeafAndCompositeFilterExpressionTypes(
  fieldName: string,
  filterExpressionTypeName: string,
  fields: Record<string, GraphQLInputFieldConfig>,
) {
  return {
    type: new GraphQLInputObjectType({
      name: `${filterExpressionTypeName}_${fieldName[0].toUpperCase()}${fieldName.slice(
        1,
      )}`,
      fields,
    }),
  };
}

function getTypeConfigs(
  fieldName: string,
  fieldTypes: Map<string, TypeParams>,
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
    entityRawOrderFieldType,
    entityRawFilterFieldType,
  }: {
    isNested?: boolean;
    orderDirectionType: GraphQLEnumType;
    orderFieldTypeConfig: ReturnType<GraphQLInputObjectType['toConfig']>;
    textFilterFieldsTypeConfig: ReturnType<GraphQLInputObjectType['toConfig']>;
    filterExpressionTypeConfig: ReturnType<GraphQLInputObjectType['toConfig']>;
    entityRawOrderFieldType: GraphQLInputObjectType;
    entityRawFilterFieldType: GraphQLInputObjectType;
  },
) {
  const fieldTypes = new Map<string, TypeParams>();

  types.forEach(type => {
    if (isUnionType(type)) {
      processTypes(schema, type.getTypes(), {
        isNested,
        orderDirectionType,
        orderFieldTypeConfig,
        textFilterFieldsTypeConfig,
        filterExpressionTypeConfig,
        entityRawOrderFieldType,
        entityRawFilterFieldType,
      });
      return;
    }
    if (isInterfaceType(type)) {
      processTypes(
        schema,
        [
          ...schema.getImplementations(type).interfaces,
          ...schema.getImplementations(type).objects,
        ],
        {
          isNested,
          orderDirectionType,
          orderFieldTypeConfig,
          textFilterFieldsTypeConfig,
          filterExpressionTypeConfig,
          entityRawOrderFieldType,
          entityRawFilterFieldType,
        },
      );
    }
    Object.entries(type.getFields()).forEach(([fieldName, field]) => {
      const [fieldDirective] = getDirective(schema, field, 'field') ?? [];
      const [resolveDirective] = getDirective(schema, field, 'resolve') ?? []
      const [sourceTypeDirective] =
        getDirective(schema, field, 'sourceType') ?? [];
      if (!fieldDirective && !isNested || resolveDirective) return;

      const fieldType = sourceTypeDirective
        ? schema.getType(sourceTypeDirective.name)
        : field.type;

      if (!fieldType)
        throw new Error(
          `Can't find "${sourceTypeDirective.name}" type described in @sourceType(name: "${sourceTypeDirective.name}") directive for "${field.name}" field of "${type.name}" type/interface`,
        );
      const fieldNamedType = getNamedType(fieldType);
      const order = { type: orderDirectionType };
      const include = { type: GraphQLBoolean };
      // NOTE: Should we handle enums differently?
      const values = { type: new GraphQLList(new GraphQLNonNull(GraphQLJSON)) };
      const orderRawFields = {
        type: new GraphQLList(new GraphQLNonNull(entityRawOrderFieldType)),
      };
      const includeRawFields = {
        type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
      };
      const valuesRawFields = {
        type: new GraphQLList(new GraphQLNonNull(entityRawFilterFieldType)),
      };

      if (
        isJsonObject(fieldNamedType) &&
        !fieldTypes.get(fieldName)?.isJsonObject
      ) {
        if (fieldTypes.get(fieldName)?.isComposite) {
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

          orderFieldTypeConfig.fields[fieldName] =
            mergeLeafAndCompositeOrderFieldTypes(
              fieldName,
              orderFieldTypeConfig.name,
              {
                ...(fieldTypes.get(fieldName)?.isLeaf ? { order } : {}),
                rawFields: orderRawFields,
                fields: createCompositeOrderFieldsType(
                  fieldName,
                  orderFieldTypeConfig.name,
                  new GraphQLInputObjectType(compositeOrderFieldTypeConfig),
                ),
              },
            );

          textFilterFieldsTypeConfig.fields[fieldName] =
            mergeLeafAndCompositeTextFilterFieldsTypes(
              fieldName,
              textFilterFieldsTypeConfig.name,
              {
                ...(fieldTypes.get(fieldName)?.isLeaf ? { include } : {}),
                rawFields: includeRawFields,
                fields: createCompositeTextFilterFieldsType(
                  fieldName,
                  textFilterFieldsTypeConfig.name,
                  new GraphQLInputObjectType(
                    compositeTextFilterFieldsTypeConfig,
                  ),
                ),
              },
            );

          filterExpressionTypeConfig.fields[fieldName] =
            mergeLeafAndCompositeFilterExpressionTypes(
              fieldName,
              filterExpressionTypeConfig.name,
              {
                ...(fieldTypes.get(fieldName)?.isLeaf ? { values } : {}),
                rawFields: valuesRawFields,
                fields: createCompositeFilterExpressionType(
                  fieldName,
                  filterExpressionTypeConfig.name,
                  new GraphQLInputObjectType(
                    compositeFilterExpressionTypeConfig,
                  ),
                ),
              },
            );
        } else {
          if (fieldTypes.get(fieldName)?.isLeaf) {
            orderFieldTypeConfig.fields[fieldName] =
              mergeLeafAndCompositeOrderFieldTypes(
                fieldName,
                orderFieldTypeConfig.name,
                {
                  order,
                  rawFields: orderRawFields,
                },
              );
            textFilterFieldsTypeConfig.fields[fieldName] =
              mergeLeafAndCompositeTextFilterFieldsTypes(
                fieldName,
                textFilterFieldsTypeConfig.name,
                {
                  include,
                  rawFields: includeRawFields,
                },
              );
            filterExpressionTypeConfig.fields[fieldName] =
              mergeLeafAndCompositeFilterExpressionTypes(
                fieldName,
                filterExpressionTypeConfig.name,
                {
                  values,
                  rawFields: valuesRawFields,
                },
              );
          } else {
            orderFieldTypeConfig.fields[fieldName] = orderRawFields;
            textFilterFieldsTypeConfig.fields[fieldName] = includeRawFields;
            filterExpressionTypeConfig.fields[fieldName] = valuesRawFields;
          }
        }
        fieldTypes.set(fieldName, {
          ...fieldTypes.get(fieldName),
          isJsonObject: true,
        });
      }

      if (
        !isJsonObject(fieldNamedType) &&
        isLeafType(fieldNamedType) &&
        !fieldTypes.get(fieldName)?.isLeaf
      ) {
        if (fieldTypes.get(fieldName)?.isComposite) {
          // NOTE: Should we check if the type is already in the schema?
          orderFieldTypeConfig.fields[fieldName] =
            mergeLeafAndCompositeOrderFieldTypes(
              fieldName,
              orderFieldTypeConfig.name,
              {
                order,
                ...(fieldTypes.get(fieldName)?.isJsonObject
                  ? { rawFields: orderRawFields }
                  : {}),
                fields: createCompositeOrderFieldsType(
                  fieldName,
                  orderFieldTypeConfig.name,
                  orderFieldTypeConfig.fields[fieldName].type,
                ),
              },
            );

          textFilterFieldsTypeConfig.fields[fieldName] =
            mergeLeafAndCompositeTextFilterFieldsTypes(
              fieldName,
              textFilterFieldsTypeConfig.name,
              {
                include,
                ...(fieldTypes.get(fieldName)?.isJsonObject
                  ? { rawFields: includeRawFields }
                  : {}),
                fields: createCompositeTextFilterFieldsType(
                  fieldName,
                  textFilterFieldsTypeConfig.name,
                  textFilterFieldsTypeConfig.fields[fieldName].type,
                ),
              },
            );

          filterExpressionTypeConfig.fields[fieldName] =
            mergeLeafAndCompositeFilterExpressionTypes(
              fieldName,
              filterExpressionTypeConfig.name,
              {
                values,
                ...(fieldTypes.get(fieldName)?.isJsonObject
                  ? { rawFields: valuesRawFields }
                  : {}),
                fields: createCompositeFilterExpressionType(
                  fieldName,
                  filterExpressionTypeConfig.name,
                  filterExpressionTypeConfig.fields[fieldName].type,
                ),
              },
            );
        } else {
          if (fieldTypes.get(fieldName)?.isJsonObject) {
            orderFieldTypeConfig.fields[fieldName] =
              mergeLeafAndCompositeOrderFieldTypes(
                fieldName,
                orderFieldTypeConfig.name,
                {
                  order,
                  rawFields: orderRawFields,
                },
              );
            textFilterFieldsTypeConfig.fields[fieldName] =
              mergeLeafAndCompositeTextFilterFieldsTypes(
                fieldName,
                textFilterFieldsTypeConfig.name,
                {
                  include,
                  rawFields: includeRawFields,
                },
              );
            filterExpressionTypeConfig.fields[fieldName] =
              mergeLeafAndCompositeFilterExpressionTypes(
                fieldName,
                filterExpressionTypeConfig.name,
                {
                  values,
                  rawFields: valuesRawFields,
                },
              );
          } else {
            orderFieldTypeConfig.fields[fieldName] = order;
            textFilterFieldsTypeConfig.fields[fieldName] = include;
            filterExpressionTypeConfig.fields[fieldName] = values;
          }
        }

        fieldTypes.set(fieldName, {
          ...fieldTypes.get(fieldName),
          isLeaf: true,
        });
      }

      if (isCompositeType(fieldNamedType)) {
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

        processTypes(schema, [fieldNamedType], {
          isNested: true,
          orderDirectionType,
          orderFieldTypeConfig: compositeOrderFieldTypeConfig,
          textFilterFieldsTypeConfig: compositeTextFilterFieldsTypeConfig,
          filterExpressionTypeConfig: compositeFilterExpressionTypeConfig,
          entityRawOrderFieldType,
          entityRawFilterFieldType,
        });

        if (fieldTypes.get(fieldName)?.isLeaf) {
          orderFieldTypeConfig.fields[fieldName] =
            mergeLeafAndCompositeOrderFieldTypes(
              fieldName,
              orderFieldTypeConfig.name,
              {
                order,
                ...(fieldTypes.get(fieldName)?.isJsonObject
                  ? { rawFields: orderRawFields }
                  : {}),
                fields: createCompositeOrderFieldsType(
                  fieldName,
                  orderFieldTypeConfig.name,
                  new GraphQLInputObjectType(compositeOrderFieldTypeConfig),
                ),
              },
            );

          textFilterFieldsTypeConfig.fields[fieldName] =
            mergeLeafAndCompositeTextFilterFieldsTypes(
              fieldName,
              textFilterFieldsTypeConfig.name,
              {
                include,
                ...(fieldTypes.get(fieldName)?.isJsonObject
                  ? { rawFields: includeRawFields }
                  : {}),
                fields: createCompositeTextFilterFieldsType(
                  fieldName,
                  textFilterFieldsTypeConfig.name,
                  new GraphQLInputObjectType(
                    compositeTextFilterFieldsTypeConfig,
                  ),
                ),
              },
            );

          filterExpressionTypeConfig.fields[fieldName] =
            mergeLeafAndCompositeFilterExpressionTypes(
              fieldName,
              filterExpressionTypeConfig.name,
              {
                values,
                ...(fieldTypes.get(fieldName)?.isJsonObject
                  ? { rawFields: valuesRawFields }
                  : {}),
                fields: createCompositeFilterExpressionType(
                  fieldName,
                  filterExpressionTypeConfig.name,
                  new GraphQLInputObjectType(
                    compositeFilterExpressionTypeConfig,
                  ),
                ),
              },
            );
        } else {
          if (fieldTypes.get(fieldName)?.isJsonObject) {
            orderFieldTypeConfig.fields[fieldName] =
              mergeLeafAndCompositeOrderFieldTypes(
                fieldName,
                orderFieldTypeConfig.name,
                {
                  rawFields: orderRawFields,
                  fields: createCompositeOrderFieldsType(
                    fieldName,
                    orderFieldTypeConfig.name,
                    new GraphQLInputObjectType(compositeOrderFieldTypeConfig),
                  ),
                },
              );
            textFilterFieldsTypeConfig.fields[fieldName] =
              mergeLeafAndCompositeTextFilterFieldsTypes(
                fieldName,
                textFilterFieldsTypeConfig.name,
                {
                  rawFields: includeRawFields,
                  fields: createCompositeTextFilterFieldsType(
                    fieldName,
                    textFilterFieldsTypeConfig.name,
                    new GraphQLInputObjectType(
                      compositeTextFilterFieldsTypeConfig,
                    ),
                  ),
                },
              );
            filterExpressionTypeConfig.fields[fieldName] =
              mergeLeafAndCompositeFilterExpressionTypes(
                fieldName,
                filterExpressionTypeConfig.name,
                {
                  rawFields: valuesRawFields,
                  fields: createCompositeFilterExpressionType(
                    fieldName,
                    filterExpressionTypeConfig.name,
                    new GraphQLInputObjectType(
                      compositeFilterExpressionTypeConfig,
                    ),
                  ),
                },
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
              type: new GraphQLInputObjectType(
                compositeFilterExpressionTypeConfig,
              ),
            };
          }
        }

        fieldTypes.set(fieldName, {
          ...fieldTypes.get(fieldName),
          isComposite: true,
        });
      }
    });
  });
}

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

  const entityRawOrderFieldType = schema.getType('EntityRawOrderField');
  if (!entityRawOrderFieldType || !isInputObjectType(entityRawOrderFieldType)) {
    throw new Error(
      '"EntityRawOrderField" type not found or isn\'t input type',
    );
  }

  const entityRawFilterFieldType = schema.getType('EntityRawFilterField');
  if (
    !entityRawFilterFieldType ||
    !isInputObjectType(entityRawFilterFieldType)
  ) {
    throw new Error(
      '"EntityRawFilterField" type not found or isn\'t input type',
    );
  }

  processTypes(schema, [entityType], {
    orderDirectionType,
    orderFieldTypeConfig,
    textFilterFieldsTypeConfig,
    filterExpressionTypeConfig,
    entityRawOrderFieldType,
    entityRawFilterFieldType,
  });

  if (!Object.keys(orderFieldTypeConfig.fields).length) {
    orderFieldTypeConfig.fields = {
      _dummy: { type: orderDirectionType },
    };
  }

  if (!Object.keys(textFilterFieldsTypeConfig.fields).length) {
    textFilterFieldsTypeConfig.fields = {
      _dummy: { type: GraphQLBoolean },
    };
  }

  if (!Object.keys(filterExpressionTypeConfig.fields).length) {
    filterExpressionTypeConfig.fields = {
      _dummy: { type: new GraphQLList(new GraphQLNonNull(GraphQLJSON)) },
    };
  }

  return addTypes(schema, [
    new GraphQLInputObjectType(orderFieldTypeConfig),
    new GraphQLInputObjectType(textFilterFieldsTypeConfig),
    new GraphQLInputObjectType(filterExpressionTypeConfig),
  ]);
}
