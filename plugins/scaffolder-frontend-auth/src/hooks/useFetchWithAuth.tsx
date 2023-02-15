import useAsync from 'react-use/lib/useAsync';
import { useAuth } from './useAuth';

export type RequestUserCredentials = {
  additionalScopes: Record<string, string[]>;
  secretsKey: string;
};

export const useFetchWithAuth = ({
  requestUserCredentials,
  url,
  fetchOpts,
}: {
  requestUserCredentials?: RequestUserCredentials;
  url: string;
  fetchOpts: {
    url: string;
    options?: Record<string, unknown>;
    headersRequiringToken?: string[];
  };
}) => {
  const token = useAuth({ url, requestUserCredentials });

  const { value, loading, error } = useAsync(async (): Promise<any> => {
    if (token) {
      const headersRequiringToken = fetchOpts?.headersRequiringToken ?? [];
      const options = fetchOpts.options ?? {};
      if (headersRequiringToken) {
        if (!options.headers) options.headers = {} as Record<string, string>;
        // add token to any existing headers
        options.headers = Object.entries(
          options.headers as Record<string, string>,
        ).reduce((headers, [header, headerValue]) => {
          if (headersRequiringToken.includes(header)) {
            headers[header] = `${headerValue}${token}`;
          } else {
            headers[header] = headerValue;
          }
          return headers;
        }, {} as Record<string, string>);

        headersRequiringToken.forEach(header => {
          if (
            !Object.keys(options.headers as Record<string, string>).includes(
              header,
            )
          ) {
            (options.headers as Record<string, string>)[header] = token;
          }
        });
      }
      const response = await fetch(fetchOpts.url, {
        ...fetchOpts.options,
        ...headersRequiringToken.reduce((headers, headerVal) => {
          headers[headerVal] = token;
          return headers;
        }, {} as Record<string, string>),
      });

      if (!response.ok) {
        throw new Error(`unable to fetch from ${fetchOpts.url}`);
      }

      return response.json();
    }
    return undefined;
  }, [token]);

  return { value, loading, error };
};
