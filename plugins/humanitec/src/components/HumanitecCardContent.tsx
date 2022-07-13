import type { FetchAppInfoResponse } from '@frontside/backstage-plugin-humanitec-common';
import {
  LinearProgress, Typography
} from '@material-ui/core';
import get from 'lodash.get';
import React from 'react';
import { HumanitecParamsActions } from '../hooks/useHumanitecParams';
import { useStyles } from '../hooks/useStyles';
import { CardContainer } from './CardContainer';
import { EnvironmentCard } from './EnvironmentCard';
import { ResourceCard } from './ResourceCard';
import { WorkloadCard } from './WorkloadCard';

interface HumanitecCardContentProps {
  environments: FetchAppInfoResponse;
  appUrl: string;
  actions: HumanitecParamsActions;
  selectedEnv?: string;
  selectedWorkload?: string;
}

export function HumanitecCardContent({
  environments,
  actions,
  selectedEnv,
  selectedWorkload,
}: HumanitecCardContentProps) {
  const classes = useStyles();

  const env = environments.find(e => e.id === selectedEnv);
  const resources = selectedWorkload && env?.resources.filter(resource => resource.res_id.startsWith(`modules.${selectedWorkload}`)) || [];
  const workloads = env?.resources.filter(resource => resource.type === "workload") || []

  return (<>
    <Typography className={classes.label} variant="h4">Environments</Typography>
    <CardContainer>
      {environments.length ? environments.map(e => (<EnvironmentCard
        key={e.id}
        env={e}
        onClick={actions.showEnvironment}
        active={e.id === selectedEnv}
      />)) : <LinearProgress className={classes.progress} />}
    </CardContainer>
    {
      environments.length > 0 ? selectedEnv && (
        <>
          <Typography className={classes.label} variant="h4">Workloads</Typography>
          <CardContainer>
            {env && workloads
              .map(resource => ({
                resource,
                workloads: get(env.runtime, resource.res_id) ?? {}
              }))
              .map(item => ({
                ...item,
                workloads: item.workloads ? Object.keys(item.workloads)
                  .map(id => ({
                    id,
                    ...item.workloads[id]
                  })) : []
              }))
              .flatMap(
                item => item.workloads
                  .map(workload => (<WorkloadCard
                    active={workload.id === selectedWorkload}
                    key={workload.id}
                    workload={workload}
                    onClick={actions.showWorkload}
                  />))
              )
            }
            {env && workloads.length === 0 && <Typography className={classes.unknownColor}>No workloads reported.</Typography>}
          </CardContainer>
        </>
      ) : null
    }
    {
      selectedWorkload && workloads.length > 0 ? (
        <>
          <Typography className={classes.label} variant="h4">Resources</Typography>
          <CardContainer>
            {resources
              .filter(resource => resource.type !== 'workload')
              .map(resource => (
                <ResourceCard
                  id={resource.res_id.substring(`modules.${selectedWorkload}.`.length)}
                  key={`${resource.res_id}:${resource.type}`}
                  resource={resource}
                />
              ))}
          </CardContainer>
        </>
      ) : null
    }
  </>)
}