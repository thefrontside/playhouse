import React, { useMemo } from 'react';
import { TaskStream } from '@backstage/plugin-scaffolder-react';
import { TaskSteps } from '@backstage/plugin-scaffolder-react/alpha';
import { Box, makeStyles, Paper } from '@material-ui/core';
import { DefaultTemplateOutputs as Outputs } from '@backstage/plugin-scaffolder-react/alpha';
import { ErrorPanel, LogViewer } from '@backstage/core-components';

const useStyles = makeStyles(
  theme => {
    return {
      root: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        '& [class^="MuiPaper-root"]:nth-child(2)': {
          overflow: 'visible !important',
        },
      },
      errorBox: {
        paddingBottom: theme.spacing(2),
      },
      taskStepsBox: {
        paddingBottom: theme.spacing(2),
      },
      logStreamPaper: {
        flexGrow: 2,
        padding: theme.spacing(2),
      },
    };
  },
  {
    name: 'EmbeddedScaffolderTaskProgress',
  },
);

export type TaskProgressClassKey = 'root' | 'errorBox' | 'taskStepsBox' | 'logStreamPaper';

export interface TaskProgressProps {
  taskStream: TaskStream;
}

export function TaskProgress({ taskStream }: TaskProgressProps): JSX.Element {
  const classes = useStyles();

  const steps = useMemo(
    () =>
      taskStream.task?.spec.steps.map(step => ({
        ...step,
        ...taskStream?.steps?.[step.id],
      })) ?? [],
    [taskStream],
  );

  const activeStep = useMemo(() => {
    for (let i = steps.length - 1; i >= 0; i--) {
      if (steps[i].status !== 'open') {
        return i;
      }
    }

    return 0;
  }, [steps]);

  return (
    <Box className={classes.root}>
      {taskStream.error && (
        <Box className={classes.errorBox}>
          <ErrorPanel
            error={taskStream.error}
            title={taskStream.error.message}
          />
        </Box>
      )}

      <Box className={classes.taskStepsBox}>
        <TaskSteps
          isComplete={taskStream.completed}
          steps={steps}
          activeStep={activeStep}
        />
      </Box>

      {taskStream.output && (
        <Outputs output={taskStream.output} />
      )}

      <Paper className={classes.logStreamPaper}>
        <LogViewer
          text={Object.values(taskStream.stepLogs)
            .map(l => l.join('\n'))
            .filter(Boolean)
            .join('\n')}
        />
      </Paper>
    </Box>
  );
}
