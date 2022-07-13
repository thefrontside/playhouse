import type { FetchAppInfoEnvironment } from '@frontside/backstage-plugin-humanitec-common';
import { Box, Typography } from '@material-ui/core';
import React from 'react';
import { useStyles } from '../hooks/useStyles';

type Resource = FetchAppInfoEnvironment['resources'][0];
interface ResourceCardProps {
  id: string;
  resource: Resource;
}

export function ResourceCard({ id, resource }: ResourceCardProps) {
  const classes = useStyles();

  let resourceValues = null;
  switch (resource.type) {
    case 'dns':
      if (isActiveDnsResource(resource)) {
        resourceValues = (
          <>
            <Box>
              <Typography component="span" color="textSecondary" className={classes.miniCardSubTitle}>host: </Typography>
              <Typography component="a" color="textPrimary" className={classes.miniCardSubTitle} href={`https://${resource.resource.host}`}>{resource.resource.host}</Typography>
            </Box>
            <Box>
              <Typography component="span" color="textSecondary" className={classes.miniCardSubTitle}>IP: </Typography>
              <Typography component="span" color="textPrimary" className={classes.miniCardSubTitle}>{resource.resource.ip_address}</Typography>
            </Box>
          </>
        );
      }
      break;
    default:
      resourceValues = null;
  }

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
      {resourceValues}
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

function isActiveDnsResource(resource: Resource): resource is Resource & { resource: { host: string; ip_address: string } } {
  return !!resource.resource && resource.type === 'dns' && resource.status === 'active';
}