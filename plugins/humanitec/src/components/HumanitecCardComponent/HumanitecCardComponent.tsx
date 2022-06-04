import React, { useEffect, useState } from 'react';
import { useEntity } from '@backstage/plugin-catalog-react';
import { useApi, configApiRef, discoveryApiRef } from '@backstage/core-plugin-api';
import {
  HumanitecAnnotationedEntity,
} from "./types";
import { HumanitecCard } from './HumanitecCard';
import type { FetchAppInfoResponse } from '@frontside/backstage-plugin-humanitec-backend';

interface HumanitecCardComponentProps {
  title?: string;
}

export function HumanitecCardComponent({ title = "Humanitec Environments" }: HumanitecCardComponentProps) {
  const config = useApi(configApiRef);
  const discovery = useApi(discoveryApiRef);

  const { entity } = useEntity<HumanitecAnnotationedEntity>();
  const [data, setData] = useState<FetchAppInfoResponse>([]);

  useEffect(() => {
    let source: EventSource;

    const appId = entity.metadata.annotations['humanitec.com/appId'];
    const orgId = entity.metadata.annotations['humanitec.com/orgId'];

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
  }, [config, discovery, entity.metadata.annotations]);

  console.log(data);

  return <HumanitecCard title={title} environments={data} />
}
