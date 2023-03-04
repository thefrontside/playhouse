import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { assert } from 'assert-ts';
import { useTaskEventStream } from '@backstage/plugin-scaffolder-react';
import { TaskLogStream, TaskSteps } from '@backstage/plugin-scaffolder-react/alpha'
import { Box, Paper } from '@material-ui/core';
import { DefaultTemplateOutputs as Outputs } from '@backstage/plugin-scaffolder-react/alpha';
import { ErrorPanel } from '@backstage/core-components';

export function TaskProgress(): JSX.Element {
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
    <>
      {taskStream.error && (
        <Box paddingBottom={2}>
          <ErrorPanel
            error={taskStream.error}
            title={taskStream.error.message}
          />
        </Box>
      )}

      <TaskSteps isComplete={taskStream.completed} steps={steps} activeStep={activeStep} />

      <Outputs output={taskStream.output} />

      <Box paddingBottom={2} height="100%">
        <Paper style={{ height: '100%' }}>
          <Box padding={2} height="100%">
            <TaskLogStream logs={taskStream.stepLogs} />
          </Box>
        </Paper>
      </Box>
    </>
  );
}