import { useAnalytics } from '@backstage/core-plugin-api';
import { TemplateParameterSchema } from '@backstage/plugin-scaffolder-react';
import { NextFieldExtensionOptions, useFormDataFromQuery, useTemplateSchema } from '@backstage/plugin-scaffolder-react/alpha';
import { JsonValue } from '@backstage/types';
import { FieldValidation } from '@rjsf/utils';
import { useState } from 'react';
import { FormValidation, useAsyncValidation } from './useAsyncValidation';
import { useValidators } from './useValidators';

interface Props {
  manifest: TemplateParameterSchema;
  initialState?: Record<string, JsonValue>;
  extensions: NextFieldExtensionOptions<any, any>[];
}

export function useStepper({ manifest, initialState, extensions }: Props) {
  const analytics = useAnalytics();
  const { steps } = useTemplateSchema(manifest);
  const [formState, setFormState] = useFormDataFromQuery(initialState);
  const [activeStep, setActiveStep] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  const [errors, setErrors] = useState<undefined | FormValidation>();

  const validators = useValidators({ extensions });

  const validation = useAsyncValidation({
    extensions,
    schema: steps[activeStep]?.mergedSchema,
    validators,
  })

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
    isValidating
  };
}

function hasErrors(errors?: FormValidation): boolean {
  if (!errors) {
    return false;
  }

  for (const error of Object.values(errors)) {
    if (isFieldValidation(error)) {
      if ((error.__errors ?? []).length > 0) {
        return true;
      }

      continue;
    }

    if (hasErrors(error)) {
      return true;
    }
  }

  return false;
}

function isFieldValidation(error: any): error is FieldValidation {
  return !!error && '__errors' in error;
}
