import React from 'react';
import { useEntity } from '@backstage/plugin-catalog-react';
import {
  HumanitecAnnotationedEntity,
} from "./types";
import { HumanitecCard } from './HumanitecCard';
import { useAppInfo } from '../../hooks/useAppInfo';

interface HumanitecCardComponentProps {
  title?: string;
}

export function HumanitecCardComponent({ title = "Humanitec Environments" }: HumanitecCardComponentProps) {
  const { entity } = useEntity<HumanitecAnnotationedEntity>();

  const appId = entity.metadata.annotations['humanitec.com/appId'];
  const orgId = entity.metadata.annotations['humanitec.com/orgId'];
  const appUrl = `https://app.humanitec.io/orgs/${orgId}/apps/${appId}`;

  const data = useAppInfo({
    appId,
    orgId,
  });

  console.log(data);

  return <HumanitecCard title={title} environments={data} appUrl={appUrl} />
}
