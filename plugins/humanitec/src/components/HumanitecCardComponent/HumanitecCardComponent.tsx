import React, { useEffect, useMemo } from 'react';
import { Progress } from '../Progress';
import { Entity } from '@backstage/catalog-model';
import {
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  makeStyles,
  Typography
} from '@material-ui/core';
import { useEntity } from '@backstage/plugin-catalog-react';
import { useApi, configApiRef } from '@backstage/core-plugin-api';
import useAsyncRetry from 'react-use/lib/useAsyncRetry';

type HumanitecAnnotationedEntity = {
  metadata: {
    annotations: {
      "humanitec.com/appId": string
      "humanitec.com/orgId": string;
    }
  }
} & Entity;

const useStyles = makeStyles({
  cardClass: {
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100% - 10px)', // for pages without content header
    marginBottom: '10px',
  },
  gridItemCardContent: {
    flex: 1,
  },
  label: {
    textTransform: 'uppercase',
    fontSize: '10px',
    fontWeight: 'bold',
    letterSpacing: 0.5,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    color: "#b5b5b5",
    marginBottom: 0
  },
  value: {
    fontWeight: 'bold',
    overflow: 'hidden',
    lineHeight: '24px',
    wordBreak: 'break-word',
  }
});

const ResourcesCard = ({ label, resources }: {label: string, resources: HumanitecEnvironmentResources[]}) => {
  return (
    <Grid item xs={12}>
    <ValueCard label={label} />
    {resources.map(resource => {
      const status = resource.status === "active"
        ? <span style={{ color: "green" }}>Active</span>
        : <span style={{ color: "yellow" }}>{resource.status}</span>;
      return (
        <Grid item key={resource.def_id}>
          <div style={{ border: "1px solid", padding: 10, marginTop: 6, borderRadius: 7, display: "inline-flex", flexDirection: "column", justifyContent: "space-between", minWidth: 240 }}>
            <span style={{ color: "lightcyan" }}>{resource.def_id}</span>
            <div>Type: {resource.type}</div>
            <div>Status: {status}</div>
          </div>
        </Grid>
      )
    })}
  </Grid>
  )
}

const PodsCard = ({ label, pods }: {label: string, pods: HumanitecControllerPods[] }) => {
 return (
  <Grid item xs={12}>
    <ValueCard label={label} />
    {pods.map(pod => {
      let podStatus;
      if (pod.phase === "Running") {
        podStatus = "🟢"
      } else if (pod.phase === "Succeeded") {
        podStatus = "⚫️"
      } else if (pod.phase === "Pending") {
        podStatus = "🟡"
      } else {
        podStatus = "🔴"
      }
      return (
        <Grid item key={pod.podName}>
          <div style={{ border: "1px solid", padding: 10, marginTop: 6, borderRadius: 7, display: "inline-flex", justifyContent: "space-between", minWidth: 270 }}>
            <div>{pod.podName}</div>
            <div>{podStatus}</div>
          </div>
        </Grid>
      )
    })}
  </Grid>
 )
}

const ValueCard = ({ label, value }: { label?: string, value?: string | JSX.Element }) => {
  const classes = useStyles();
  return (
    <>
      <Typography variant="h2" className={classes.label}>
        {label}
      </Typography>
      <Typography variant="body2" className={classes.value}>
        {value}
      </Typography>
    </>
  )
}

const EnvironmentCard = ({ env = undefined, name }: {env: HumanitecEnvironmentAndRunTime | undefined | any, name: string }) => {
  let status = env.module[name].status == "Success"
    ? <span style={{ color: "green" }}><b>Success</b></span>
    : <span style={{ color: "yellow" }}><b>Pending</b></span>
  return (
    <div key={env.id} style={{ border: "1px solid grey", padding: 13, borderRadius: 5 }}>
      <Grid container>
        <Grid item xs={12}>
          <ValueCard label="Environment" value={env.name} />
        </Grid>
        <Divider />
        <Grid item xs={12} sm={6} lg={4}>
          <ValueCard label="Type" value={env.module[name].kind} />
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <ValueCard label="Module" value={name} />
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <ValueCard label="Status" value={status} />
        </Grid>
        <PodsCard label="Replicas" pods={env.module[name].pods} />
        <ResourcesCard label="Resources" resources={env.resources} />
      </Grid>
    </div>
  )
}

export const HumanitecCard = ({ environments, retry, loading, name }: { environments: HumanitecEnvironmentAndRunTime[], retry: () => void, loading: boolean, name: string }) => {
  const classes = useStyles();

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    function scheduleRetry() {
      timeout = setTimeout(() => {
        retry();
        scheduleRetry();
      }, 1000);
    }

    !loading && scheduleRetry()
    return () => timeout && clearTimeout(timeout);
  }, [loading, retry])

  return (
    <Card className={classes.cardClass}>
      <CardHeader
        title={<>
          Humanitec Environments {loading && <Progress size={14} thickness={7} style={{ margin: 4 }}/>}
        </>}
      />
      <Divider />
      <CardContent className={classes.gridItemCardContent}>
        {
          environments.length
            ? environments.map(env => <EnvironmentCard env={env} name={name} key={name} />)
            : <div>There are no active deployments</div>
        }
      </CardContent>
    </Card>
  )
}

type HumanitecEnvironmentAndRunTime = HumanitecEnvironment & {
  module: Record<string, HumanitecControllerResponse>;
  resources: HumanitecEnvironmentResources[];
}

interface HumanitecEnvironment {
  id: string;
  name: string;
  namespace: string;
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

type HumanitecRuntimeInfoModules = Record<string, Record<string, HumanitecControllerResponse>>;

interface HumanitecRuntimeInfo {
  modules: HumanitecRuntimeInfoModules;
  namespace: string;
}

interface HumanitecEnvironmentResources {
  app_id: string;
  def_id: string;
  env_id: string;
  env_type: string;
  org_id: string;
  resource: Record<string, string>;
  data: Record<string, string>;
  res_id: string;
  type: string;
  status: string;
  updated_at: string;
}

export const HumanitecCardComponent = () => {
  const config = useApi(configApiRef);
  const { entity } = useEntity<HumanitecAnnotationedEntity>();
  const appId = entity.metadata.annotations['humanitec.com/appId'];
  const orgId = entity.metadata.annotations['humanitec.com/orgId'];

  const { value: environments, loading, retry } = useAsyncRetry(async () => {
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

    async function fetchActiveEnvironmentResources(envId: string) {
      const response = await fetch(`${baseUrl}/api/proxy/humanitec/orgs/${orgId}/apps/${appId}/envs/${envId}/resources`);
      const data = await response.json() as HumanitecEnvironmentResources[];
      return data;
    }

    const environments = await fetchEnvironments();
    return Promise.all(environments.map(async ({ id, name, type, namespace }) => ({
      id,
      name,
      type,
      namespace,
      runtime: await fetchRuntimeInfo(id),
      resources: await fetchActiveEnvironmentResources(id),
    })));
  }, [appId, orgId]);

  console.log(environments);

  const deployedEnvironments = useMemo(() => {
    if (environments) {
      return environments
        .filter((environment) => Object.keys(environment.runtime.modules).includes(entity.metadata.name))
        .map(({ name, namespace, id, runtime, type, resources }) => ({
          name,
          namespace,
          id,
          type,
          module: runtime.modules[entity.metadata.name],
          resources: resources.filter(resource => {
            const externalResourceFormat = new RegExp(`modules.${entity.metadata.name}.externals.(.*)`)
            return resource.res_id.match(externalResourceFormat);
          }),
        }))
    }

    return [];
  }, [environments, entity]);

  return <HumanitecCard environments={deployedEnvironments} loading={loading} retry={retry} name={entity.metadata.name} />;
};
