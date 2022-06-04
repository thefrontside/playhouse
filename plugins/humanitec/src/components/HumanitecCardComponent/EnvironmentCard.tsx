import React from 'react';
import {
  Box,
  IconButton,
  Typography
} from '@material-ui/core';
import LinkIcon from '@material-ui/icons/Link';
import type { FetchAppInfoEnvironment } from '@frontside/backstage-plugin-humanitec-backend';
import { useStyles } from './useStyles';

interface EnvironmentCardProps {
  env: FetchAppInfoEnvironment;
  appUrl: string;
}

export function EnvironmentCard({ env, appUrl }: EnvironmentCardProps) {
  const classes = useStyles();

  return (
    <Box className={classes.environmentCard}>
      <Box className={classes.environmentTitleContainer}>
        <Typography className={classes.environmentName} variant="h6">{env.name}</Typography>
        <IconButton className={classes.environmentButton} component='a' href={`${appUrl}/envs/${env.id}`}>
          <LinkIcon />
        </IconButton>
      </Box>
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