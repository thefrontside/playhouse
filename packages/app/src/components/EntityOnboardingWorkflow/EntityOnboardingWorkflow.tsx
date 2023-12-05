import React from 'react';
import {
  ANNOTATION_ORIGIN_LOCATION,
  stringifyEntityRef,
} from '@backstage/catalog-model';
import { useEntity } from '@backstage/plugin-catalog-react';
import {
  EmbeddedScaffolderWorkflowProps,
  Stepper,
  useRunWorkflow,
  useWorkflowManifest,
  type RunWorkflow,
  TaskProgress,
  Workflow,
} from '@frontside/backstage-plugin-scaffolder-workflow';
import { assert } from 'assert-ts';

import { ScaffolderFieldExtensions } from '@backstage/plugin-scaffolder-react';
import { configuredFieldExtensions } from '../../extensions';
import {
  ParsedTemplateSchema,
  ReviewState,
} from '@backstage/plugin-scaffolder-react/alpha';

import {
  Stepper as MuiStepper,
  Step as MuiStep,
  StepLabel as MuiStepLabel,
  Button,
  makeStyles,
} from '@material-ui/core';
import { InfoCard, MarkdownContent } from '@backstage/core-components';
import { BackstageTheme } from '@backstage/theme';

type EntityOnboardingWorkflowProps = EmbeddedScaffolderWorkflowProps;

const useStyles = makeStyles<BackstageTheme>(theme => ({
  formWrapper: {
    padding: theme.spacing(2),
  },
  formFooter: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'right',
    marginTop: theme.spacing(2),
  },
  markdown: {
    /** to make the styles for React Markdown not leak into the description */
    '& :first-child': {
      marginTop: 0,
    },
    '& :last-child': {
      marginBottom: 0,
    },
  },
}));

function OnboardingActions({
  stepper,
  workflow,
  formRef,
  whichComponent,
}: {
  formRef?: any;
  stepper?: Stepper;
  workflow: RunWorkflow;
  whichComponent: string;
}) {
  const errors = formRef?.current?.state?.errors ?? [];
  const styles = useStyles();
  if (stepper) {
    console.log(whichComponent, errors);
    return (
      <div className={styles.formFooter}>
        <Button
          onClick={stepper.handleBack}
          disabled={stepper.activeStep < 1 || stepper.isValidating}
        >
          Back
        </Button>
        {stepper.activeStep > stepper.steps.length - 1 ? (
          <Button
            variant="contained"
            color="primary"
            disabled={stepper.isValidating}
            type="button"
            onClick={() => workflow?.execute(stepper.formState)}
          >
            Create
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            type="submit"
            disabled={stepper.isValidating}
          >
            Next
          </Button>
        )}
      </div>
    );
  }
  return null;
}

export function EntityOnboardingWorkflow(
  props: EntityOnboardingWorkflowProps,
): JSX.Element | null {
  const styles = useStyles();
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

  const workflowErrorHandler = () => {
    // when ...args: any[]
    // console.log('workflow error', args);
  };

  const workflowCompleteHandler = () => {
    // when ...args: any[]
    // console.log('workflow complete', args);
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
    <InfoCard
      title={manifest.title}
      subheader={
        <MarkdownContent
          className={styles.markdown}
          content={manifest.description ?? 'No description'}
        />
      }
      noPadding
      titleTypographyProps={{ component: 'h2' }}
    >
      <div className={styles.formWrapper}>
        <Workflow
          manifest={manifest}
          workflow={workflow}
          initialState={{ entityRef, catalogInfoUrl }}
          formFooter={
            <OnboardingActions workflow={workflow} whichComponent="footer" />
          }
          stepperProgress={<StepperProgress />}
          reviewComponent={<EntityOnboardingReview workflow={workflow} />}
        >
          <ScaffolderFieldExtensions>
            {configuredFieldExtensions.map((FieldExtension, index) => (
              <FieldExtension key={`fieldExtension${index}`} />
            ))}
          </ScaffolderFieldExtensions>
        </Workflow>
      </div>
      {workflow.taskStream.loading === false && (
        <TaskProgress taskStream={workflow.taskStream} />
      )}
    </InfoCard>
  ) : null;
}

function EntityOnboardingReview({
  stepper,
  workflow,
}: {
  stepper?: Stepper;
  workflow: RunWorkflow;
}) {
  const styles = useStyles();
  if (stepper) {
    return (
      <div className={styles.formWrapper}>
        <ReviewState schemas={stepper.steps} formState={stepper.formState} />
        <OnboardingActions
          workflow={workflow}
          stepper={stepper}
          whichComponent="review"
        />
      </div>
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
