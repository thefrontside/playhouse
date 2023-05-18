import { useApi } from '@backstage/core-plugin-api';
import {
  scaffolderApiRef,
  useTemplateSecrets,
} from '@backstage/plugin-scaffolder-react';
import { JsonValue } from '@backstage/types';
import { useAsync } from '@react-hookz/web';
import { useState } from 'react';

interface Props {
  templateRef: string;
}

export function useRunWorkflow({ templateRef }: Props) {
  const scaffolderApi = useApi(scaffolderApiRef);
  const [taskId, setTaskId] = useState<string>();
  const { secrets } = useTemplateSecrets();

  const [state, { execute }] = useAsync(async function runScaffolderWorkflow(
    values: Record<string, JsonValue>,
  ) {
    const { taskId: id } = await scaffolderApi.scaffold({
      templateRef,
      values,
      secrets,
    });

    setTaskId(id);
  });

  return { state, execute, taskId };
}
