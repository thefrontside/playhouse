import React, { ReactNode } from 'react';
import {
  ParsedTemplateSchema,
  StepperProps,
} from '@backstage/plugin-scaffolder-react/alpha';
import { Form } from './Form';
import { assert } from 'assert-ts';
import { JsonValue } from '@backstage/types';
import { useStepper } from '../../hooks';

type FormWrapperProps = Omit<StepperProps, 'components'> & {
  children: ReactNode;
  handleNext: ({
    formData,
  }: {
    formData?: Record<string, JsonValue> | undefined;
  }) => Promise<void>;
};

export function FormWrapper({
  manifest,
  ...props
}: FormWrapperProps): JSX.Element {
  const { steps } = useStepper({ manifest });

  assert(steps.length > 0, `no steps`);

  return <Form step={manifest.steps[0] as ParsedTemplateSchema} {...props} />;
}
