import {
  TemplateParameterSchema,
  useCustomFieldExtensions,
  useCustomLayouts,
} from '@backstage/plugin-scaffolder-react';
import { NextFieldExtensionOptions } from '@backstage/plugin-scaffolder-react/alpha';
import { JsonValue } from '@backstage/types';
import { ErrorSchema } from '@rjsf/utils';
import React, { ReactNode, cloneElement, useCallback, useEffect } from 'react';
import {
  RunWorkflow,
  useStepper,
  useTransformSchemaToProps,
  type Stepper,
} from '../../hooks';
import { Form, type RJSFFormProps, type FormProps } from '../Form';

type WorkflowProps = {
  children: ReactNode;
  manifest: TemplateParameterSchema;
  workflow: RunWorkflow;
  initialState?: Record<string, JsonValue>;
  formFooter?: JSX.Element;
  stepperProgress?: JSX.Element;
  reviewComponent?: JSX.Element;
  FormComponent?: FormProps['Component'];
  FormProps?: RJSFFormProps;
};

/**
 * With the hooks from this package, one can recreate the Scaffolder
 * form and review component implementing fully customized design and UI.
 * 
 * @param children - Used to pass any field extensions expected by the RJSF form
 * @param manifest - The template as returned from the `useWorkflowManifest` hook
 * @param workflow - The workflow as returned by the `useRunWorkflow` hook
 * @param initialState - The form's initial state
 * @param formFooter - Component which handles the form forward, back and review buttons
 * @param stepperProgress - Component which represents the user's current progress in the form
 * @param reviewComponent - Component which shows the review state after the form is complete and ready for submission
 * @param FormComponent - RJSF Component constructor 
 * 
 * @example using the component
 * ```javascript
    <Workflow
      manifest={manifest}
      workflow={workflow}
      initialState={{ entityRef, catalogInfoUrl }}
      formFooter={<OnboardingActions workflow={workflow} />}
      stepperProgress={<StepperProgress />}
      reviewComponent={<EntityOnboardingReview workflow={workflow} />}
    >
      <ScaffolderFieldExtensions>
        {configuredFieldExtensions.map((FieldExtension, index) => (
          <FieldExtension key={`fieldExtension${index}`} />
        ))}
      </ScaffolderFieldExtensions>
    </Workflow>
 * ```
 */
export const Workflow = ({
  FormComponent,
  children,
  formFooter,
  manifest,
  initialState,
  stepperProgress,
  workflow,
  reviewComponent,
  FormProps = {}
}: WorkflowProps) => {
  const customFieldExtensions =
    useCustomFieldExtensions<NextFieldExtensionOptions<any, any>>(children);

  const layouts = useCustomLayouts(children);

  const stepper = useStepper({
    manifest,
    extensions: customFieldExtensions,
    initialState,
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

  if (stepper.activeStep >= stepper.steps.length) {
    return cloneElement(
      reviewComponent ?? (
        <DefaultReviewComponent workflow={workflow} />
      ),
      {
        stepper,
      },
    );
  }

  return (
    <>
      {stepperProgress
        ? cloneElement(stepperProgress, {
            ...stepper,
          })
        : null}
      <Form
        Component={FormComponent}
        extensions={customFieldExtensions}
        handleNext={handleForward}
        step={currentStep}
        extraErrors={stepper.errors as unknown as ErrorSchema}
        initialState={stepper.formState}
        {...FormProps}
      >
        {children}
        {formFooter
          ? cloneElement(formFooter, {
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
