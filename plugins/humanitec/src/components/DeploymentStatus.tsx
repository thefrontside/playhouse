import React from 'react';
import { Typography } from '@material-ui/core';
import { FetchAppInfoEnvironment } from '@frontside/backstage-plugin-humanitec-backend';
import { useStyles } from '../hooks/useStyles';

export function DeploymentStatus({ env }: { env: FetchAppInfoEnvironment; }) {
  const classes = useStyles();

  switch (env.last_deploy?.status) {
    case 'succeeded':
      return (<Typography className={`${classes.deploymentStatus} ${classes.deploymentSucceededStatus}`}>Succeeded</Typography>);
    case 'pending':
      return (<Typography className={`${classes.deploymentStatus}`} color="primary">Pending</Typography>);
    case 'in progress':
      return (<Typography className={`${classes.deploymentStatus} ${classes.deploymentInProgressStatus}`} color="secondary">In Progress</Typography>);
    case 'failed':
      return (<Typography className={`${classes.deploymentStatus} ${classes.deploymentFailedStatus}`}>Failed</Typography>);
    default:
      return (<Typography className={`${classes.deploymentStatus} ${classes.deploymentNeverDeployedStatus}`}>Never deployed</Typography>);
  }
}
