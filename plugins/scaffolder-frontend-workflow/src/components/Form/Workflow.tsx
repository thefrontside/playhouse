import React, { ReactNode, useCallback, cloneElement, useEffect } from 'react';
import {
  TemplateParameterSchema,
  useCustomFieldExtensions,
  useCustomLayouts,
} from '@backstage/plugin-scaffolder-react';
import {
  Form,
  Stepper,
  useStepper,
  useTransformSchemaToProps,
  RunWorkflow,
} from '@frontside/backstage-plugin-scaffolder-workflow';
import { NextFieldExtensionOptions } from '@backstage/plugin-scaffolder-react/alpha';
import { JsonValue } from '@backstage/types';
import { ErrorSchema } from '@rjsf/utils';
import { makeStyles } from '@material-ui/core';

type OnboardingWorkflowProps = {
  children: ReactNode;
  manifest: TemplateParameterSchema;
  workflow: RunWorkflow;
  initialState?: Record<string, JsonValue>;
  formFooter?: JSX.Element;
  stepperProgress?: JSX.Element;
  reviewComponent?: JSX.Element;
};

const useStyles = makeStyles(theme => ({
  formWrapper: {
    padding: theme.spacing(2),
  },
}));

export const Workflow = (props: OnboardingWorkflowProps) => {
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

  const handleForward = useCallback(
    async formData => {
      stepper.handleForward({ formData });
    },
    [stepper],
  );

  const styles = useStyles();
  if (stepper.activeStep >= stepper.steps.length) {
    return (
      <div className={styles.formWrapper}>
        {cloneElement(
          props.reviewComponent ?? (
            <DefaultReviewComponent workflow={props.workflow} />
          ),
          {
            stepper,
          },
        )}
      </div>
    );
  }

  return (
    <>
      {props.stepperProgress
        ? cloneElement(props.stepperProgress, {
            ...stepper,
          })
        : null}
      <Form
        extensions={customFieldExtensions}
        handleNext={handleForward}
        step={currentStep}
        extraErrors={stepper.errors as unknown as ErrorSchema}
        {...props}
      >
        {props.children}
        {props.formFooter
          ? cloneElement(props.formFooter, {
              stepper,
            })
          : null}
      </Form>
    </>
  );
};

function DefaultReviewComponent({
  workflow,
  stepper,
}: {
  stepper?: Stepper;
  workflow: RunWorkflow;
}) {
  useEffect(() => {
    if (stepper && workflow.taskStatus === 'idle')
      workflow.execute(stepper.formState);
  }, [workflow, stepper]);

  return null;
}
