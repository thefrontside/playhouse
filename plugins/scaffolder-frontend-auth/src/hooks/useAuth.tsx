import { useState } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import { scmAuthApiRef } from '@backstage/integration-react';
import { useTemplateSecrets } from '@backstage/plugin-scaffolder-react';
import useDebounce from 'react-use/lib/useDebounce';

export type RequestUserCredentials = {
  additionalScopes: Record<string, string[]>;
  secretsKey: string;
};

export const useAuth = ({
  requestUserCredentials,
  url,
}: {
  requestUserCredentials?: RequestUserCredentials;
  url?: string;
} = {}) => {
  const schAuthApi = useApi(scmAuthApiRef);
  const { setSecrets } = useTemplateSecrets();
  const [localToken, setToken] = useState<string | undefined>();

  useDebounce(
    async () => {
      if (!requestUserCredentials || !url) return;

      const { token } = await schAuthApi.getCredentials({
        url,
        additionalScope: {
          repoWrite: true,
          ...(requestUserCredentials?.additionalScopes
            ? { customScopes: requestUserCredentials.additionalScopes }
            : {}),
        },
      });

      if (requestUserCredentials?.secretsKey)
        setSecrets({ [requestUserCredentials.secretsKey]: token });
      setToken(token);
    },
    500,
    [localToken, requestUserCredentials],
  );

  return localToken ? localToken : undefined;
};
