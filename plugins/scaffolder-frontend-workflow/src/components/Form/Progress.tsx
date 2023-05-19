import { useTaskEventStream } from '@backstage/plugin-scaffolder-react';
import { Progress } from '@backstage/core-components';
import React, { useEffect } from 'react';
import { WorkflowProps } from '@backstage/plugin-scaffolder-react/dist/alpha';

type Props = {
  taskId: string;
  onComplete?: () => void;
} & Pick<WorkflowProps, 'onError'>;

export function TaskProgress({ taskId, onComplete, onError }: Props) {
  const taskStream = useTaskEventStream(taskId);

  // const steps = useMemo(
  //   () =>
  //     taskStream.task?.spec.steps.map(step => ({
  //       ...step,
  //       ...taskStream?.steps?.[step.id],
  //     })) ?? [],
  //   [taskStream],
  // );

  // const activeStep = useMemo(() => {
  //   for (let i = steps.length - 1; i >= 0; i--) {
  //     if (steps[i].status !== 'open') {
  //       return i;
  //     }
  //   }

  //   return 0;
  // }, [steps]);

  useEffect(() => {
    if (taskStream.error) {
      // eslint-disable-next-line no-console
      console.error(taskStream.error);

      onError?.(taskStream.error);
      return;
    }

    if (taskStream.completed) {
      onComplete?.();
    }
  }, [onComplete, onError, taskStream.completed, taskStream.error]);

  return <Progress />;
}
