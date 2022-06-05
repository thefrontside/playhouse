import { Box, Typography } from '@material-ui/core';
import React, { useCallback } from 'react';
import { useStyles } from '../hooks/useStyles';

interface Workload {
  id: string;
  pods: {}[];
  replicas: number;
  status: string;
}

interface WorkloadCardProps {
  workload: Workload;
  onClick: (id: string) => void;
  active: boolean
}

export function WorkloadCard({ workload, onClick, active }: WorkloadCardProps) {
  const classes = useStyles();

  const _onClick = useCallback(() => onClick(workload.id), [workload, onClick]) 

  console.log(workload)
  return (
    <Box role="button" className={`${classes.miniCard} ${active && classes.environmentCardActive}`} onClick={_onClick}>
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