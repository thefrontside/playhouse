import React, { cloneElement } from 'react';
import { useStepper } from '../../hooks/useStepper';
import { useTransformSchemaToProps } from '../../hooks/useTransformSchemaToProps';
import { NextFieldExtensionOptions } from '@backstage/plugin-scaffolder-react/dist/alpha';
import { WorkflowProps } from '@backstage/plugin-scaffolder-react/alpha';
import { LayoutOptions, TemplateParameterSchema } from '@backstage/plugin-scaffolder-react';

type StepperProps = Pick<WorkflowProps, 'initialState'> & {
  manifest: TemplateParameterSchema;
  extensions: NextFieldExtensionOptions<any, any>[];
  layouts?: LayoutOptions[];
  form: JSX.Element;
  children: JSX.Element;
};

export const Stepper = (props: StepperProps) => {
  const stepper = useStepper({
    manifest: props.manifest,
    extensions: props.extensions,
    initialState: props.initialState,
  });

  const currentStep = useTransformSchemaToProps(stepper.currentStep, {
    layouts: props.layouts,
  });

  return cloneElement(props.form, {
    step: currentStep,
    initialState: stepper.formState
  }, cloneElement(props.children, stepper))
};
