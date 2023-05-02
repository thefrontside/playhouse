import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { assert } from 'assert-ts';
import { useTaskEventStream } from '@backstage/plugin-scaffolder-react';
import {
  TaskLogStream,
  TaskSteps,
} from '@backstage/plugin-scaffolder-react/alpha';
import { Box, makeStyles, Paper } from '@material-ui/core';
import { DefaultTemplateOutputs as Outputs } from '@backstage/plugin-scaffolder-react/alpha';
import { ErrorPanel } from '@backstage/core-components';

const useStyles = makeStyles(
  theme => {
    return {
      contentWrapper: {
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
      logStreamOuterBox: {
        flexGrow: 2,
        paddingBottom: theme.spacing(2),
      },
      logStreamPaper: {
        height: '100%',
      },
      logStreamInnerBox: {
        height: '100%',
        padding: theme.spacing(2),
      },
    };
  },
  {
    name: 'EmbeddedScaffolderTaskProgress',
  },
);

export function TaskProgress(): JSX.Element {
  const classes = useStyles();
  const { taskId } = useParams();

  assert(!!taskId, `no taskId in path`);

  const taskStream = useTaskEventStream(taskId);
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
    <Box className={classes.contentWrapper}>
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

      <Box className={classes.logStreamOuterBox}>
        <Paper className={classes.logStreamPaper}>
          <Box className={classes.logStreamInnerBox}>
            <TaskLogStream logs={taskStream.stepLogs} />
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
