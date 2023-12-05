import { useAnalytics } from '@backstage/core-plugin-api';
import type {
  FieldExtensionOptions,
  TemplateParameterSchema,
} from '@backstage/plugin-scaffolder-react';
import {
  useFormDataFromQuery,
  useTemplateSchema,
} from '@backstage/plugin-scaffolder-react/alpha';
import { JsonObject, JsonValue } from '@backstage/types';
import { ErrorSchema, toErrorList } from '@rjsf/utils';
import { useState } from 'react';
import { useAsyncValidation } from './useAsyncValidation';
import { useValidators } from './useValidators';

interface Props {
  manifest: TemplateParameterSchema;
  initialState?: Record<string, JsonValue>;
  extensions: FieldExtensionOptions<any, any>[];
}

export type Stepper = ReturnType<typeof useStepper>;

export function useStepper({ manifest, initialState, extensions }: Props) {
  const analytics = useAnalytics();
  const { steps } = useTemplateSchema(manifest);
  const [formState, setFormState] = useFormDataFromQuery(initialState);
  const [activeStep, setActiveStep] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  const [errors, setErrors] = useState<undefined | ErrorSchema<JsonObject>>();

  const validators = useValidators({ extensions });

  const validation = useAsyncValidation({
    extensions,
    // this includes both the schema and the uiSchema
    //  which is required to look up and run async validation
    schema: steps[activeStep]?.mergedSchema,
    validators,
  });

  const handleBack = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1);
  };

  const handleForward = async ({
    formData = {},
  }: {
    formData?: Record<string, JsonValue>;
  }) => {
    // The validation should never throw, as the validators are wrapped in a try/catch.
    // This makes it fine to set and unset state without try/catch.
    setErrors(undefined);
    setIsValidating(true);

    const returnedValidation = await validation(formData);

    setIsValidating(false);

    if (hasErrors(returnedValidation)) {
      setErrors(returnedValidation);
    } else {
      setErrors(undefined);
      setActiveStep(prevActiveStep => {
        const stepNum = prevActiveStep + 1;
        analytics.captureEvent('click', `Next Step (${stepNum})`);
        return stepNum;
      });
    }
    setFormState(current => ({ ...current, ...formData }));
  };

  return {
    steps,
    handleBack,
    handleForward,
    activeStep,
    currentStep: steps[activeStep],
    errors,
    formState,
    isValidating,
  };
}

function hasErrors(errors?: ErrorSchema<JsonObject>): boolean {
  const errorList = toErrorList(errors);
  return errorList.length > 0;
}
