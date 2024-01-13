import { EventSourcePolyfill } from "event-source-polyfill";
import { configApiRef, discoveryApiRef, useApi, identityApiRef } from '@backstage/core-plugin-api';
import type { FetchAppInfoResponse } from '@frontside/backstage-plugin-humanitec-common';
import { useEffect, useState } from 'react';
import { HUMANITEC_MISSING_ANNOTATION_ERROR } from '../annotations';

export function useAppInfo({ appId, orgId }: { appId: string; orgId: string }) {
  const [data, setData] = useState<FetchAppInfoResponse | Error>([]);
  const config = useApi(configApiRef);
  const discovery = useApi(discoveryApiRef);
  const identity = useApi(identityApiRef);

  useEffect(() => {
    let source: EventSourcePolyfill;

    if (appId && orgId) {
      createEventSource().then((s) => {
        source = s;

        source.addEventListener('update-success', (message: any) => {
          try {
            if (message.data) {
              setData(JSON.parse(message.data));
            }
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error(e);
          }
        });

        source.addEventListener('update-failure', (message: any) => {
          if (message.data) {
            setData(new Error(message.data));
          }
          source.close();
        });
      }, (e) => {
        setData(new Error(e.message));
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

    async function createEventSource() {
      const [url, { token }] = await Promise.all([createUrl(), identity.getCredentials()]);

      const headers: Record<string, string> = {}
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      return new EventSourcePolyfill(url, { headers });
    }
  }, [config, discovery, identity, appId, orgId]);

  return data;
}
