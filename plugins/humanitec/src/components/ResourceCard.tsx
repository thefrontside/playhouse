import React from 'react';
import { Box, Typography } from '@material-ui/core';
import { useStyles } from '../hooks/useStyles';
import type { FetchAppInfoEnvironment } from '@frontside/backstage-plugin-humanitec-backend';

interface ResourceCardProps {
  id: string;
  resource: FetchAppInfoEnvironment['resources'][0];
}

export function ResourceCard({ id, resource }: ResourceCardProps) {
  const classes = useStyles();

  return (
    <Box className={`${classes.miniCard}`}>
      <Box className={classes.miniCardTitleContainer}>
        <Typography className={classes.miniCardTitle} variant="h6">{id}</Typography>
      </Box>
      <Box>
        <Typography component="span" color="textSecondary" className={classes.miniCardSubTitle}>type: </Typography>
        <Typography component="span" color="textPrimary" className={classes.miniCardSubTitle}>{resource.type}</Typography>
      </Box>
      <Box>
        <Typography component="span" color="textSecondary" className={classes.miniCardSubTitle}>status: </Typography>
        <ResourceStatus status={resource.status} />
      </Box>

    </Box>
  )
}

function ResourceStatus({ status }: { status: 'pending' | 'active' | 'deleting' }) {
  const classes = useStyles();

  switch (status) {
    case 'active':
      return <Typography component="span" className={`${classes.miniCardSubTitle} ${classes.successColor}`}>Active</Typography>
    case 'pending':
      return <Typography component="span" className={`${classes.miniCardSubTitle} ${classes.pendingColor}`}>Pending</Typography>
    case 'deleting':
      return <Typography component="span" color="secondary" className={`${classes.miniCardSubTitle} ${classes.pendingColor}`}>Deleting</Typography>
    default:
      return <Typography component="span" className={`${classes.miniCardSubTitle} ${classes.unknownColor}`}>Unknown</Typography>

  }

}