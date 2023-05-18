import { useApi } from '@backstage/core-plugin-api';
import { scaffolderApiRef } from '@backstage/plugin-scaffolder-react';
import { useEffect } from 'react';

interface Props {
  templateRef: string;
}

export function useRunWorkflow({}) {
  const scaffolderApi = useApi(scaffolderApiRef);

  useEffect(() => {
    async function runScaffolderWorkflow() {
      const { taskId } = await scaffolderApi.scaffold({
        templateRef,
        values,
        secrets,
      });
    }
  }, []);
}
