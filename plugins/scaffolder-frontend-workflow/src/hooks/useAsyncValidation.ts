import { useMemo } from 'react';
import {
  NextCustomFieldValidator,
  NextFieldExtensionOptions,
  NextFieldExtensionUiSchema,
  createFieldValidation,
  extractSchemaFromStep,
} from '@backstage/plugin-scaffolder-react/alpha';
import { Draft07 as JSONSchema, isJSONError } from 'json-schema-library';

import { useApiHolder, ApiHolder } from '@backstage/core-plugin-api';
import { JsonObject, JsonValue } from '@backstage/types';
import { ErrorSchemaBuilder } from '@rjsf/utils';
import { Validators } from './useValidators';

export interface AsyncValidationProps {
  extensions: NextFieldExtensionOptions<any, any>[];
  // this is required as it also includes the uiSchema
  // mergedSchema from useTemplateSchema().steps[activeStep].mergedSchema
  schema: JsonObject;
  validators: Validators;
}

export function useAsyncValidation(props: AsyncValidationProps) {
  const apiHolder = useApiHolder();
  const { schema, validators } = props;

  return useMemo(() => {
    return createAsyncValidators(schema, validators, {
      apiHolder,
    });
  }, [schema, validators, apiHolder]);
}

function createAsyncValidators(
  rootSchema: JsonObject,
  validators: Record<
    string,
    undefined | NextCustomFieldValidator<unknown, unknown>
  >,
  context: {
    apiHolder: ApiHolder;
  },
) {
  async function validate(
    formData: JsonObject,
    pathPrefix: string[] = [],
    currentSchema = rootSchema,
    errorBuilder: ErrorSchemaBuilder = new ErrorSchemaBuilder<
      typeof currentSchema
    >(),
  ): Promise<ErrorSchemaBuilder<typeof currentSchema>> {
    const parsedSchema = new JSONSchema(currentSchema);
    const validateForm = async (
      validatorName: string,
      path: string[],
      value: JsonValue | undefined,
      schema: JsonObject,
      uiSchema: NextFieldExtensionUiSchema<unknown, unknown>,
    ) => {
      const validator = validators[validatorName];
      if (validator) {
        const fieldValidation = createFieldValidation();
        try {
          await validator(value, fieldValidation, {
            ...context,
            formData,
            schema,
            uiSchema,
          });
        } catch (ex) {
          // @ts-expect-error 'ex' is of type 'unknown'.ts(18046)
          errorBuilder.addErrors(ex.message, path);
        }
        if (fieldValidation.__errors)
          errorBuilder.addErrors(fieldValidation?.__errors, path);
      }
    };

    for (const key of Object.keys(currentSchema?.properties ?? {})) {
      const value = formData[key];
      const path = pathPrefix.concat([key]);
      // this takes the schema and resolves any references
      const definitionInSchema = parsedSchema.step(
        key,
        currentSchema,
        formData,
      );
      if (isJSONError(definitionInSchema)) {
        // eslint-disable-next-line no-console
        console.error(
          `${definitionInSchema.name}: ${definitionInSchema.message}`,
        );
        // ideally this will only be a dev time error, but if it isn't addressed
        //  before it reaches production, the user would not be able to address
        //  the error anyways.
        throw new Error(
          `Form key ${key} threw an error. Please raise this error with the team.\n${`${definitionInSchema.name}: ${definitionInSchema.message}`}`,
        );
      }
      const { schema, uiSchema } = extractSchemaFromStep(definitionInSchema);

      const hasItems = definitionInSchema && definitionInSchema.items;

      const doValidateItem = async (
        propValue: JsonObject,
        itemSchema: JsonObject,
        itemUiSchema: NextFieldExtensionUiSchema<unknown, unknown>,
      ) => {
        await validateForm(
          propValue['ui:field'] as string,
          path,
          value,
          itemSchema,
          itemUiSchema,
        );
      };

      const doValidate = async (propValue: JsonObject) => {
        if ('ui:field' in propValue) {
          const { schema: itemsSchema, uiSchema: itemsUiSchema } =
            extractSchemaFromStep(definitionInSchema.items);
          await doValidateItem(propValue, itemsSchema, itemsUiSchema);
        }
      };

      if (isObject(value)) {
        await validate(value, path, definitionInSchema, errorBuilder);
        if ('ui:field' in definitionInSchema) {
          await validateForm(
            definitionInSchema['ui:field'] as string,
            path,
            value,
            schema,
            uiSchema,
          );
        }
      } else if (definitionInSchema && 'ui:field' in definitionInSchema) {
        await doValidateItem(definitionInSchema, schema, uiSchema);
      } else if (hasItems && 'ui:field' in definitionInSchema.items) {
        await doValidate(definitionInSchema.items);
      } else if (hasItems && definitionInSchema.items.type === 'object') {
        const properties = (definitionInSchema.items?.properties ??
          []) as JsonObject[];
        for (const [, propValue] of Object.entries(properties)) {
          await doValidate(propValue);
        }
      }
    }

    return errorBuilder;
  }

  return async (formData: JsonObject) => {
    const validated = await validate(formData);
    return validated.ErrorSchema;
  };
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
