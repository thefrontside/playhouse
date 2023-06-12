import { useMemo } from 'react';
import {
  NextCustomFieldValidator,
  NextFieldExtensionOptions,
  NextFieldExtensionUiSchema,
  createFieldValidation,
  extractSchemaFromStep,
} from '@backstage/plugin-scaffolder-react/alpha';
import { Draft07 as JSONSchema } from 'json-schema-library';

import { useApiHolder, ApiHolder } from '@backstage/core-plugin-api';
import { JsonObject, JsonValue } from '@backstage/types';
import { FieldValidation } from '@rjsf/utils';
import { Validators } from './useValidators';

interface Props {
  extensions: NextFieldExtensionOptions<any, any>[];
  // mergedSchema from useTemplateSchema().steps[activeStep].mergedSchema
  schema: JsonObject;
  validators: Validators;
}

export function useAsyncValidation(props: Props) {
  const apiHolder = useApiHolder();

  return useMemo(() => {
    return createAsyncValidators(props.schema, props.validators, {
      apiHolder,
    });
  }, [props.schema, props.validators, apiHolder]);
}

export type FormValidation = {
  [name: string]: FieldValidation | FormValidation;
};

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
    pathPrefix: string = '#',
    current: JsonObject = formData,
  ): Promise<FormValidation> {
    const parsedSchema = new JSONSchema(rootSchema);
    const formValidation: FormValidation = {};

    const validateForm = async (
      validatorName: string,
      key: string,
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
          fieldValidation.addError(ex.message);
        }
        formValidation[key] = fieldValidation;
      }
    };

    for (const [key, value] of Object.entries(current)) {
      const path = `${pathPrefix}/${key}`;
      const definitionInSchema = parsedSchema.getSchema(path, formData);
      const { schema, uiSchema } = extractSchemaFromStep(definitionInSchema);

      const hasItems = definitionInSchema && definitionInSchema.items;

      const doValidateItem = async (
        propValue: JsonObject,
        itemSchema: JsonObject,
        itemUiSchema: NextFieldExtensionUiSchema<unknown, unknown>,
      ) => {
        await validateForm(
          propValue['ui:field'] as string,
          key,
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

      if (definitionInSchema && 'ui:field' in definitionInSchema) {
        await doValidateItem(definitionInSchema, schema, uiSchema);
      } else if (hasItems && 'ui:field' in definitionInSchema.items) {
        await doValidate(definitionInSchema.items);
      } else if (hasItems && definitionInSchema.items.type === 'object') {
        const properties = (definitionInSchema.items?.properties ??
          []) as JsonObject[];
        for (const [, propValue] of Object.entries(properties)) {
          await doValidate(propValue);
        }
      } else if (isObject(value)) {
        formValidation[key] = await validate(formData, path, value);
      }
    }

    return formValidation;
  }

  return async (formData: JsonObject) => {
    return await validate(formData);
  };
};

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}