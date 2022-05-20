import React from 'react';
import { Progress } from '@backstage/core-components';
import { Entity } from '@backstage/catalog-model';
import { useEntity } from '@backstage/plugin-catalog-react';
import { useApi, configApiRef } from '@backstage/core-plugin-api';
import Alert from '@material-ui/lab/Alert';
import useAsync from 'react-use/lib/useAsync';

type HumanitecAnnotationedEntity = {
  metadata: {
    annotations: {
      "humanitec.com/appId": string
      "humanitec.com/orgId": string;
    }
  }
} & Entity;

export const HumanitecCard = ({ environments }: { environments: HumanitecEnvironment[] }) => {
  return (
    <>
      <h4>Humanitect Environments</h4>
      <ul>
        {environments.map(env => <li key={env.id}>{env.id}</li>)}
      </ul>
    </>
  )
}

interface HumanitecEnvironment {
  id: string;
}

export const HumanitecCardComponent = () => {
  const config = useApi(configApiRef);
  const { entity } = useEntity<HumanitecAnnotationedEntity>();
  const appId = entity.metadata.annotations['humanitec.com/appId'];
  const orgId = entity.metadata.annotations['humanitec.com/orgId'];

  const { value, loading, error } = useAsync(async (): Promise<HumanitecEnvironment[]> => {
    const baseUrl = config.getString('backend.baseUrl');
    const response = await fetch(`${baseUrl}/api/proxy/humanitec/orgs/${orgId}/apps/${appId}/envs`);
    const data = await response.json();
    return data;
  }, [appId, orgId]);

  if (loading) {
    return <Progress />;
  } else if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  } else if (value === undefined) {
    return <p>Service not deployed on Humanitec.</p>
  }

  return <HumanitecCard environments={value} />;
};
