import React, { ReactNode } from 'react';
import {
  Card,
  CardContent,
  Divider,
  Typography,
  LinearProgress
} from '@material-ui/core';
import { useStyles } from '../hooks/useStyles';
import { EnvironmentCard } from "./EnvironmentCard";
import type { FetchAppInfoResponse } from '@frontside/backstage-plugin-humanitec-backend';
import { HumanitecParamsActions } from '../hooks/useHumanitecParams';
import get from 'lodash.get';
import { CardContainer } from './CardContainer';
import { WorkloadCard } from './WorkloadCard';

interface HumanitecCardProps {
  header: ReactNode;
  environments: FetchAppInfoResponse;
  appUrl: string;
  actions: HumanitecParamsActions;
  selectedEnv?: string;
}

export function HumanitecCard({
  header,
  environments,
  actions,
  selectedEnv
}: HumanitecCardProps) {
  const classes = useStyles();

  const visible = environments.find(env => env.id === selectedEnv);

  return (
    <Card className={classes.cardClass}>
      {header}
      <Divider />
      <CardContent className={classes.gridItemCardContent}>
        <Typography className={classes.label} variant="h4">Environments</Typography>
        <CardContainer>
          {environments.length ? environments.map(env => (<EnvironmentCard
            key={env.id}
            env={env}
            onClick={actions.showEnvironment}
            active={env.id === selectedEnv}
          />)) : <LinearProgress className={classes.progress} />}
        </CardContainer>
        {environments.length > 0 ? selectedEnv && (
          <>
            <Typography className={classes.label} variant="h4">Workloads</Typography>
            <CardContainer>
              {visible && visible.resources
                .filter(resource => resource.type === "workload")
                .map(resource => ({
                  resource,
                  workloads: get(visible.runtime, resource.res_id) ?? {}
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
                    .map(workload => <WorkloadCard key={workload.id} workload={workload} />)
                )
              }
            </CardContainer>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

