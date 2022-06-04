import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Divider,
  Box,
  Typography
} from '@material-ui/core';
import { useStyles } from './useStyles';
import { EnvironmentCard } from "./EnvironmentCard";
import type { FetchAppInfoResponse } from '@frontside/backstage-plugin-humanitec-backend';

interface HumanitecCardProps {
  title: string;
  environments: FetchAppInfoResponse;
  appUrl: string;
}

export function HumanitecCard({
  title,
  environments,
  appUrl
}: HumanitecCardProps) {
  const classes = useStyles();

  return (
    <Card className={classes.cardClass}>
      <CardHeader
        className={classes.cardHeader}
        title={title}
      />
      <Divider />
      <CardContent className={classes.gridItemCardContent}>
        <Box className={classes.environmentsContainer}>
          {environments.length ? environments.map(env => <EnvironmentCard key={env.id} env={env} appUrl={appUrl} />) : <Typography>Retrieving environment information...</Typography>}
        </Box>
      </CardContent>
    </Card>
  );
}
