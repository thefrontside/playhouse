import { useEffect, useState } from 'react';
import { useApi, configApiRef, discoveryApiRef } from '@backstage/core-plugin-api';
import type { FetchAppInfoResponse } from '@frontside/backstage-plugin-humanitec-backend';
import { HUMANITEC_MISSING_ANNOTATION_ERROR } from '../annotations';

export function useAppInfo({ appId, orgId }: { appId: string; orgId: string }) {
  const [data, setData] = useState<FetchAppInfoResponse | Error>([]);
  const config = useApi(configApiRef);
  const discovery = useApi(discoveryApiRef);

  useEffect(() => {
    let source: EventSource;

    if (appId && orgId) {
      createUrl().then((url) => {
        source = new EventSource(url);

        source.addEventListener('update-success', (message) => {
          try {
            if (message instanceof MessageEvent) {
              setData(JSON.parse(message.data));
            }
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error(e);
          }
        });

        source.addEventListener('update-failure', (message) => {
          if (message instanceof MessageEvent) {
            setData(new Error(message.data))
          }
        })
      });
    } else {
      setData(new Error(HUMANITEC_MISSING_ANNOTATION_ERROR))
    }

    return () => {
      if (source) {
        source.close();
      }
    };

    async function createUrl() {
      const url = `${await discovery.getBaseUrl('humanitec')}/environments`;
      const params = new URLSearchParams({
        appId,
        orgId
      });
      return `${url}?${params}`;
    }
  }, [config, discovery, appId, orgId]);

  return data;
}