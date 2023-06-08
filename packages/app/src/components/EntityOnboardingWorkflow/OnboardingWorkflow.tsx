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
import { ErrorSchema } from '@rjsf/utils';
import React, { ReactNode, useCallback } from 'react';

type OnboardingWorkflowProps = {
  children: ReactNode;
  manifest: TemplateParameterSchema;
  initialState?: Record<string, JsonValue>;
} & ReturnType<typeof useRunWorkflow>;

export const OnboardingWorkflow = (props: OnboardingWorkflowProps) => {
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
    async data => {
      console.log('handle next', data);
      stepper.handleForward(data);
    },
    [stepper],
  );

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
