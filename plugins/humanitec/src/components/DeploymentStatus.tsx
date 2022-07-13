import type { FetchAppInfoEnvironment } from '@frontside/backstage-plugin-humanitec-common';
import { Typography } from '@material-ui/core';
import React from 'react';
import { useStyles } from '../hooks/useStyles';

export function DeploymentStatus({ env }: { env: FetchAppInfoEnvironment; }) {
  const classes = useStyles();

  switch (env.last_deploy?.status) {
    case 'succeeded':
      return (<Typography className={`${classes.deploymentStatus} ${classes.successColor}`}>Succeeded</Typography>);
    case 'pending':
      return (<Typography className={`${classes.deploymentStatus}`} color="primary">Pending</Typography>);
    case 'in progress':
      return (<Typography className={`${classes.deploymentStatus} ${classes.inProgressColor}`} color="secondary">In Progress</Typography>);
    case 'failed':
      return (<Typography className={`${classes.deploymentStatus} ${classes.failColor}`}>Failed</Typography>);
    default:
      return (<Typography className={`${classes.deploymentStatus} ${classes.unknownColor}`}>Never deployed</Typography>);
  }
}
