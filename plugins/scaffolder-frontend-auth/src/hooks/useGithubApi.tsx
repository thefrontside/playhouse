import useAsync from 'react-use/lib/useAsync';
import { useAuth } from './useAuth';

export type RequestUserCredentials = {
  additionalScopes: Record<string, string[]>;
  secretsKey: string;
};

export const useGithubApi = ({
  requestUserCredentials,
  queryUrl,
  method = 'GET',
}: {
  requestUserCredentials?: RequestUserCredentials;
  queryUrl: string;
  method?: 'GET' | 'HEAD' | 'PATCH' | 'POST' | 'PUT' | 'DELETE';
}) => {
  const token = useAuth({ url: 'https://github.com', requestUserCredentials });

  const { value, loading, error } = useAsync(async (): Promise<any> => {
    if (token) {
      const response = await fetch(
        `https://api.github.com/${
          queryUrl.startsWith('/') ? queryUrl.slice(1) : queryUrl
        }`,
        {
          method,
          headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`unable to fetch from ${queryUrl}`);
      }

      return response.json();
    }
    return undefined;
  }, [token]);

  return { value, loading, error };
};
