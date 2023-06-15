import React from 'react';

import {
  Stepper,
  type RunWorkflow,
  useWorkflowManifest,
  useRunWorkflow,
  TaskProgress,
  Workflow,
} from '@frontside/backstage-plugin-scaffolder-workflow';
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
import { BackstageTheme } from '@backstage/theme';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { InfoCard, MarkdownContent } from '@backstage/core-components';

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

export function ScaffolderWorkflow(props: {
  templateName: string;
  namespace?: string;
}): JSX.Element | null {
  const styles = useStyles();

  const { loading, manifest } = useWorkflowManifest({
    name: props.templateName,
    namespace: props.namespace,
  });

  const templateRef = stringifyEntityRef({
    kind: 'Template',
    namespace: props.namespace,
    name: props.templateName,
  });

  const workflow = useRunWorkflow({
    templateRef,
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
          initialState={{}}
          formFooter={<FormActions workflow={workflow} />}
          stepperProgress={<StepperProgress />}
          reviewComponent={<EntityReview workflow={workflow} />}
          children={<></>}
        />
      </div>
      {workflow.taskStream.loading === false && (
        <TaskProgress taskStream={workflow.taskStream} />
      )}
    </InfoCard>
  ) : null;
}

export function FormActions({
  stepper,
  workflow,
}: {
  stepper?: Stepper;
  workflow: RunWorkflow;
}) {
  const styles = useStyles();
  if (stepper) {
    const buttonText =
      stepper.activeStep === stepper.steps.length - 1 ? 'Review' : 'Continue';
    return (
      <div className={styles.formFooter}>
        <Button
          onClick={stepper.handleBack}
          disabled={stepper.activeStep < 1 || stepper.isValidating}
        >
          Back
        </Button>
        {stepper.activeStep === stepper.steps.length ? (
          <Button
            variant="contained"
            color="primary"
            onClick={() => workflow?.execute(stepper.formState)}
            type="button"
            disabled={workflow?.taskStatus !== 'idle'}
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
            {buttonText}
          </Button>
        )}
      </div>
    );
  }
  return null;
}

export function EntityReview({
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
        <h1>Review Page</h1>
        <ReviewState schemas={stepper.steps} formState={stepper.formState} />
        <FormActions workflow={workflow} stepper={stepper} />
      </div>
    );
  }

  return null;
}

export function StepperProgress({
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
