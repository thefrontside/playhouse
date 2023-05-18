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

  useEffect(() => {
    if (taskStream.error) {
      // eslint-disable-next-line no-console
      console.error(taskStream.error);

      onError(taskStream.error);
      return;
    }

    if (taskStream.completed) {
      onComplete?.();
    }
  }, [onComplete, onError, taskStream.completed, taskStream.error]);

  return <Progress />;
}
