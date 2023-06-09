import React, { useCallback, useState } from 'react';
import {
  ANNOTATION_ORIGIN_LOCATION,
  stringifyEntityRef,
} from '@backstage/catalog-model';
import { useEntity } from '@backstage/plugin-catalog-react';
import {
  EmbeddedScaffolderWorkflowProps,
  Stepper,
  useRunWorkflow,
  useStepper,
} from '@frontside/backstage-plugin-scaffolder-workflow';
import { assert } from 'assert-ts';
import {
  useWorkflowManifest,
  type RunWorkflow,
  TaskProgress,
} from '@frontside/backstage-plugin-scaffolder-workflow';
import { ReusableWorkflow } from './ReusableWorkflow';

import { ScaffolderFieldExtensions } from '@backstage/plugin-scaffolder-react';
import { characterTextField } from './FieldExtension';
import { scaffolderPlugin } from '@backstage/plugin-scaffolder';
import {
  createNextScaffolderFieldExtension,
  ParsedTemplateSchema,
} from '@backstage/plugin-scaffolder-react/alpha';

import {
  Stepper as MuiStepper,
  Step as MuiStep,
  StepLabel as MuiStepLabel,
  Button,
} from '@material-ui/core';

export const configuredFieldExtensions = [characterTextField].map(extension =>
  scaffolderPlugin.provide(createNextScaffolderFieldExtension(extension)),
);

type EntityOnboardingWorkflowProps = EmbeddedScaffolderWorkflowProps;

function OnboardingActions(props: ReturnType<typeof useStepper>) {
  console.log(props);
  return (
    <>
      <Button
        onClick={props.handleBack}
        disabled={props.activeStep < 1 || props.isValidating}
      >
        Back
      </Button>
      <Button
        variant="contained"
        color="primary"
        type="submit"
        disabled={props.isValidating}
      >
        {props.activeStep === props.steps.length - 1 ? 'Review' : 'Next'}
      </Button>
    </>
  );
}

export function EntityOnboardingWorkflow(
  props: EntityOnboardingWorkflowProps,
): JSX.Element | null {
  const { entity } = useEntity();

  const entityRef = stringifyEntityRef(entity);

  const catalogInfoUrl = entity.metadata?.annotations?.[
    ANNOTATION_ORIGIN_LOCATION
  ].replace(/^url:/, '');

  assert(
    !!catalogInfoUrl,
    `no catalog-info.yaml url in ${ANNOTATION_ORIGIN_LOCATION} annotation`,
  );

  const { loading, manifest } = useWorkflowManifest({
    name: props.templateName,
    namespace: props.namespace,
  });

  const templateRef = stringifyEntityRef({
    kind: 'Template',
    namespace: props.namespace,
    name: props.templateName,
  });

  const workflowErrorHandler = (...args: any[]) => {
    console.log('workflow error', args);
  };

  const workflowCompleteHandler = (...args: any[]) => {
    console.log('workflow complete', args);
  };

  const workflow = useRunWorkflow({
    templateRef,
    onError: workflowErrorHandler,
    onComplete: workflowCompleteHandler,
  });

  if (loading) {
    return <>Loading template...</>;
  }

  return manifest ? (
    <>
      <ReusableWorkflow
        manifest={manifest}
        workflow={workflow}
        initialState={{ entityRef, catalogInfoUrl }}
        formFooter={<OnboardingActions />}
        stepperProgress={<StepperProgress />}
        reviewComponent={<EntityOnboardingReview workflow={workflow} />}
      >
        <ScaffolderFieldExtensions>
          {configuredFieldExtensions.map((FieldExtension, index) => (
            <FieldExtension key={`fieldExtension${index}`} />
          ))}
        </ScaffolderFieldExtensions>
      </ReusableWorkflow>
      {workflow.taskStream.loading === false && (
        <TaskProgress taskStream={workflow.taskStream} />
      )}
    </>
  ) : null;
}

function EntityOnboardingReview({
  stepper,
  workflow,
}: {
  stepper?: Stepper;
  workflow: RunWorkflow;
}) {
  if (stepper) {
    return (
      <>
        <ul>
          {Object.entries(stepper.formState).map(([key, value]) => (
            <li key={key}>
              <strong>{key}</strong>: {value}
            </li>
          ))}
        </ul>
        <button onClick={() => stepper.handleBack()}>Back</button>
        <button onClick={() => workflow.execute(stepper.formState)}>Run</button>
      </>
    );
  }

  return null;
}

function StepperProgress({
  activeStep,
  steps = [],
}: {
  activeStep?: number;
  steps?: ParsedTemplateSchema[];
}) {
  return (
    <MuiStepper activeStep={activeStep} alternativeLabel variant="elevation">
      {steps.map((step, index) => (
        <MuiStep key={index}>
          <MuiStepLabel>{step.title}</MuiStepLabel>
        </MuiStep>
      ))}
      <MuiStep>
        <MuiStepLabel>Review</MuiStepLabel>
      </MuiStep>
    </MuiStepper>
  );
}
