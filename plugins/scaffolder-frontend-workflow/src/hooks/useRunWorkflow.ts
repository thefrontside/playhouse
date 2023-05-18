import { useApi } from '@backstage/core-plugin-api';
import {
  scaffolderApiRef,
  useTemplateSecrets,
} from '@backstage/plugin-scaffolder-react';
import { useEffect, useState } from 'react';
import type { OnCompleteArgs } from '../types';
import { useAsync } from '@react-hookz/web';

interface Props {
  templateRef: string;
  values: OnCompleteArgs;
}

export function useRunWorkflow({ templateRef, values }: Props) {
  const scaffolderApi = useApi(scaffolderApiRef);
  const { secrets } = useTemplateSecrets();
  const [taskId, setTaskId] = useState<string>();

  const [state, { execute }] = useAsync(async function runScaffolderWorkflow() {
    const { taskId: id } = await scaffolderApi.scaffold({
      templateRef,
      values,
      secrets,
    });

    setTaskId(id);
  });

  useEffect(() => {
    execute();
  }, [execute, scaffolderApi, secrets, templateRef, values]);

  return { ...state, taskId };
}
