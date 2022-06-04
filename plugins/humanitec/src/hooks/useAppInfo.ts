import { useEffect, useState } from 'react';
import { useApi, configApiRef, discoveryApiRef } from '@backstage/core-plugin-api';
import type { FetchAppInfoResponse } from '@frontside/backstage-plugin-humanitec-backend';

export function useAppInfo({ appId, orgId }: { appId: string; orgId: string }) {
  const [data, setData] = useState<FetchAppInfoResponse>([]);
  const config = useApi(configApiRef);
  const discovery = useApi(discoveryApiRef);

  useEffect(() => {
    let source: EventSource;

    (async () => {
      const url = `${await discovery.getBaseUrl('humanitec')}/environments`;
      const params = new URLSearchParams({
        appId,
        orgId
      });
      return `${url}?${params}`;
    })().then((url) => {
      source = new EventSource(url);

      source.onmessage = (message) => {
        try {
          setData(JSON.parse(message.data));
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error(e);
        }
      };
    });

    return () => {
      if (source) {
        source.close();
      }
    };
  }, [config, discovery, appId, orgId]);

  return data;
}