import { JsonValue } from '@backstage/types';
import { type IChangeEvent } from '@rjsf/core-v5';
import React, { useCallback, useMemo, type ReactNode } from 'react';
import validator from '@rjsf/validator-ajv8';
import { RJSFForm, type RJSFFormProps } from './RJSFForm';

import {
  type NextFieldExtensionOptions,
  useFormDataFromQuery,
  ParsedTemplateSchema,
} from '@backstage/plugin-scaffolder-react/alpha';

export type FormProps = {
  extensions: NextFieldExtensionOptions<any, any>[];
  step: ParsedTemplateSchema;
  Component?: typeof RJSFForm;
  initialState?: Record<string, JsonValue>;
  handleNext: ({
    formData,
  }: {
    formData?: Record<string, JsonValue> | undefined;
  }) => Promise<void>;
  children: ReactNode;
} & RJSFFormProps;

export const Form = ({
  Component = RJSFForm,
  step,
  extensions,
  initialState,
  handleNext,
  ...props
}: FormProps) => {
  const [formData, setFormData] = useFormDataFromQuery(initialState);

  const fields = useMemo(() => {
    return Object.fromEntries(
      extensions.map(({ name, component }) => [name, component]),
    );
  }, [extensions]);

  const handleChange = useCallback(
    (e: IChangeEvent) =>
      setFormData(current => ({ ...current, ...e.formData })),
    [setFormData],
  );

  const onSubmit = async (params: {
    formData?: Record<string, JsonValue>;
  }) => {
    const { formData: _formData = {} } = params;

    handleNext(_formData);

    setFormData(current => ({ ...current, ..._formData }));
  };

  return (
    <Component
      validator={validator}
      schema={step.schema}
      uiSchema={step.uiSchema}
      fields={fields}
      formData={formData}
      formContext={{ formData }}
      onSubmit={onSubmit}
      onChange={handleChange}
      {...props}
      showErrorList={false}
      noHtml5Validate
    >
      {props.children}
    </Component>
  );
};
