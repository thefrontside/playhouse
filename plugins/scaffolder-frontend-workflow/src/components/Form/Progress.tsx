import { useTaskEventStream } from '@backstage/plugin-scaffolder-react';
import { Progress } from '@backstage/core-components';
import React, { useEffect, useMemo } from 'react';

interface Props {
  taskId: string;
  onComplete?: () => void;
}

export function TaskProgress({ taskId, onComplete }: Props) {
  const taskStream = useTaskEventStream(taskId);

  useEffect(() => {
    if (taskStream.completed) {
      onComplete?.();
    }
  }, [onComplete, taskStream.completed]);

  return <Progress />;
}
