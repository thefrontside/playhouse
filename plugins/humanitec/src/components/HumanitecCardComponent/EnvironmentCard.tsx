import React from 'react';
import {
  Box,
  Typography
} from '@material-ui/core';
import type { FetchAppInfoEnvironment } from '@frontside/backstage-plugin-humanitec-backend';
import { useStyles } from './useStyles';

export function EnvironmentCard({ env }: { env: FetchAppInfoEnvironment }) {
  const classes = useStyles();

  return (
    <Box className={classes.environmentCard}>
      <Typography className={classes.environmentName} variant="h6">{env.name}</Typography>
      <Typography className={classes.environmentId} variant="subtitle1">{env.id}</Typography>
      <DeploymentStatus env={env} />
    </Box>
  )
}

function DeploymentStatus({ env }: { env: FetchAppInfoEnvironment }) {
  const classes = useStyles();

  switch (env.last_deploy?.status) {
    case 'succeeded':
      return (<Typography className={`${classes.deploymentStatus} ${classes.deploymentSucceededStatus}`}>Succeeded</Typography>)
    case 'pending':
      return (<Typography className={`${classes.deploymentStatus}`} color="primary">Pending</Typography>)
    case 'in progress':
      return (<Typography className={`${classes.deploymentStatus} ${classes.deploymentInProgressStatus}`} color="secondary">In Progress</Typography>)
    case 'failed':
      return (<Typography className={`${classes.deploymentStatus} ${classes.deploymentFailedStatus}`}>Failed</Typography>)
    default:
      return (<Typography className={`${classes.deploymentStatus} ${classes.deploymentNeverDeployedStatus}`}>Never deployed</Typography>)
  }
}