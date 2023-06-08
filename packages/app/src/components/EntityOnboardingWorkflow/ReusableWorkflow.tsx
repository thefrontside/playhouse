import {
  TemplateParameterSchema,
  useCustomFieldExtensions,
  useCustomLayouts,
} from '@backstage/plugin-scaffolder-react';
import { NextFieldExtensionOptions } from '@backstage/plugin-scaffolder-react/alpha';
import { JsonValue } from '@backstage/types';
import {
  Form,
  useRunWorkflow,
  useStepper,
  useTransformSchemaToProps,
} from '@frontside/backstage-plugin-scaffolder-workflow';
import { RunWorkflow } from '@frontside/backstage-plugin-scaffolder-workflow';
import { ErrorSchema } from '@rjsf/utils';
import React, { ReactNode, useCallback, cloneElement } from 'react';

type OnboardingWorkflowProps = {
  children: ReactNode;
  manifest: TemplateParameterSchema;
  workflow: RunWorkflow
  initialState?: Record<string, JsonValue>;
  reviewComponent?: JSX.Element;
};

export const ReusableWorkflow = (props: OnboardingWorkflowProps) => {
  const customFieldExtensions = useCustomFieldExtensions<
    NextFieldExtensionOptions<any, any>
  >(props.children);

  const layouts = useCustomLayouts(props.children);

  const stepper = useStepper({
    manifest: props.manifest,
    extensions: customFieldExtensions,
    initialState: props.initialState,
  });

  const currentStep = useTransformSchemaToProps(
    stepper.steps[stepper.activeStep],
    { layouts },
  );

  const handleNext = useCallback(
    async formData => {
      console.log('handle next', formData);
      stepper.handleForward({ formData });
    },
    [stepper],
  );

  if (stepper.activeStep >= stepper.steps.length) {
    return cloneElement(props.reviewComponent ?? <></>, {
      stepper,
    });
  }

  return (
    <>
      <Form
        extensions={customFieldExtensions}
        handleNext={handleNext}
        step={currentStep}
        extraErrors={stepper.errors as unknown as ErrorSchema}
        {...props}
      >
        {props.children}
        <button type="submit">Submit</button>
      </Form>
    </>
  );
};
