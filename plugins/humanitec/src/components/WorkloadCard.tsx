import { Box, Typography } from '@material-ui/core';
import React from 'react';
import { useStyles } from '../hooks/useStyles';

interface Workload {
  id: string;
  pods: {}[];
  replicas: number;
  status: string;
}

export function WorkloadCard({ workload }: { workload: Workload }) {
  const classes = useStyles();

  console.log(workload)
  return (
    <Box className={classes.miniCard}>
      <Box className={classes.environmentTitleContainer}>
        <Typography className={classes.miniCardTitle} variant="h6">{workload.id}</Typography>
      </Box>
      <Box>
        <Typography component="span" color="textSecondary" className={classes.miniCardSubTitle}>Pods: </Typography>
        <Typography component="span" color="textPrimary" className={classes.miniCardSubTitle}>{workload.pods.length} of {workload.replicas}</Typography>
      </Box>
      <Box>
        <Typography component="span" color="textSecondary" className={classes.miniCardSubTitle}>Status: </Typography>
        <Typography component="span" color="textPrimary" className={classes.miniCardSubTitle}>{workload.status}</Typography>
      </Box>
    </Box>
  )
}