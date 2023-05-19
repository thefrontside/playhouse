import { useApi } from '@backstage/core-plugin-api';
import {
  scaffolderApiRef,
  useTemplateSecrets,
} from '@backstage/plugin-scaffolder-react';
import { JsonValue } from '@backstage/types';
import { useAsync } from '@react-hookz/web';
import { useEffect, useState } from 'react';
import { useTaskEventStream } from './useTaskEventStream';
import type { WorkflowProps } from '@backstage/plugin-scaffolder-react/alpha';

type Props = {
  templateRef: string;
  onComplete?: () => void;
} & Pick<WorkflowProps, 'onError'>;

type TaskStatus = 'not-executed' | 'pending' | 'error' | 'success';

export function useRunWorkflow({ templateRef, onComplete, onError }: Props) {
  const scaffolderApi = useApi(scaffolderApiRef);
  const [taskId, setTaskId] = useState<string>();
  const { secrets } = useTemplateSecrets();
  const taskStream = useTaskEventStream(taskId);
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('not-executed');


  const [state, { execute }] = useAsync(async function runScaffolderWorkflow(
    values: Record<string, JsonValue>,
  ) {
    setTaskStatus('pending');
    
    const { taskId: id } = await scaffolderApi.scaffold({
      templateRef,
      values,
      secrets,
    });

    setTaskId(id);
  });

  useEffect(() => {
    if (taskStream.error) {
      // eslint-disable-next-line no-console
      console.error(taskStream.error);

      setTaskStatus('error');
      onError?.(taskStream.error);
      return;
    }

    if (taskStream.completed) {
      setTaskStatus('success');
      onComplete?.();
    }
  }, [onComplete, onError, taskStream.completed, taskStream.error]);

  return { state, execute, taskId, taskStream, taskStatus };
}
