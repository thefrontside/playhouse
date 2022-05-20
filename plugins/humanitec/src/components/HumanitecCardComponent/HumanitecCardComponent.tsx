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

export const HumanitecCard = ({ environments }: { environments: HumanitecEnvironmentAndRunTime[] }) => {
  console.log(environments)
  return (
    <>
      <h4>Humanitect Environments</h4>
      <ul>
        {environments.map(env => {
          return (
          <li key={env.id}>{env.id}
          </li>
          )
        })}
      </ul>
    </>
  )
}

type HumanitecEnvironmentAndRunTime = HumanitecEnvironment & {
  runtime: HumanitecRuntimeInfo;
}

interface HumanitecEnvironment {
  id: string;
  name: string;
  namespace?: string;
  type: string;
}

interface HumanitecControllerPods {
  containerStatuses: Record<string, any>[];
  phase: string;
  podName: string;
  revision: number;
  status: string;
}

interface HumanitecControllerResponse {
  kind: string;
  replicas: number;
  status: string;
  pods: HumanitecControllerPods[]
}

interface HumanitecRuntimeInfo {
  modules: Record<string, Record<string, HumanitecControllerResponse>>
  namespace: string;
}

export const HumanitecCardComponent = () => {
  const config = useApi(configApiRef);
  const { entity } = useEntity<HumanitecAnnotationedEntity>();
  const appId = entity.metadata.annotations['humanitec.com/appId'];
  const orgId = entity.metadata.annotations['humanitec.com/orgId'];

  const { value, loading, error } = useAsync(async () => {
    const baseUrl = config.getString('backend.baseUrl');

    async function fetchEnvironments() {
      const response = await fetch(`${baseUrl}/api/proxy/humanitec/orgs/${orgId}/apps/${appId}/envs`);
      const data = await response.json() as HumanitecEnvironment[];
      return data;
    }

    async function fetchRuntimeInfo(envId: string) {
      const response = await fetch(`${baseUrl}/api/proxy/humanitec/orgs/${orgId}/apps/${appId}/envs/${envId}/runtime`);
      const data = await response.json() as HumanitecRuntimeInfo;
      return data;
    }

    const environments = await fetchEnvironments();
    return Promise.all(environments.map(async ({ id, name, type }) => ({
      id,
      name,
      type,
      runtime: await fetchRuntimeInfo(id)
    })));
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
