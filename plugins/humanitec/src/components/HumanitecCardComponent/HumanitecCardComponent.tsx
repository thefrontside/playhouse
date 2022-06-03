import React, { useEffect, useState } from 'react';
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
import { useApi, configApiRef, discoveryApiRef } from '@backstage/core-plugin-api';
import {
  HumanitecAnnotationedEntity,
  HumanitecEnvironmentAndRunTime,
  HumanitecControllerPods,
  HumanitecEnvironmentResources,
} from "./types";

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

const EnvironmentCard = ({ env = undefined, name }: {env: HumanitecEnvironmentAndRunTime | undefined | any, name: string }) => {
  const status = env.module[name].status === "Success"
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

export const HumanitecCard = ({ environments, name }: { environments: HumanitecEnvironmentAndRunTime[], retry: () => void, loading: boolean, name: string }) => {
  const classes = useStyles();

  return (
    <Card className={classes.cardClass}>
      <CardHeader
        title="Humanitec Environments"
      />
      <Divider />
      <CardContent className={classes.gridItemCardContent}>
        {
          environments.length
            ? environments.map(env => <EnvironmentCard env={env} name={name} key={name} />)
            : <div>No information available</div>
        }
      </CardContent>
    </Card>
  )
}

export const HumanitecCardComponent = () => {
  const config = useApi(configApiRef);
  const discovery = useApi(discoveryApiRef);

  const { entity } = useEntity<HumanitecAnnotationedEntity>();
  const [data, setData] = useState();


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
      }
    })

    return () => {
      if (source) {
        source.close();
      }
    }
  }, [config, discovery, entity.metadata.annotations]);

  console.log(data); 

  return <></>;
  // return <HumanitecCard environments={deployedEnvironments} loading={loading} retry={retry} name={entity.metadata.name} />;
};
