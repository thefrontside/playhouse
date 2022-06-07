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

  return (
    <Box role="button" className={`${classes.miniCard} ${active && classes.environmentCardActive}`} onClick={_onClick}>
      <Box className={classes.miniCardTitleContainer}>
        <Typography className={classes.miniCardTitle} variant="h6">{workload.id}</Typography>
      </Box>
      <Box>
        <Typography component="span" color="textSecondary" className={classes.miniCardSubTitle}>pods: </Typography>
        <Typography component="span" color="textPrimary" className={classes.miniCardSubTitle}>{workload.pods.length} of {workload.replicas}</Typography>
      </Box>
      <Box>
        <Typography component="span" color="textSecondary" className={classes.miniCardSubTitle}>status: </Typography>
        <WorkloadStatus status={workload.status} />
      </Box>
    </Box>
  )
}

function WorkloadStatus({ status }: { status: string }) {
  const classes = useStyles();

  switch (status) {
    case 'Success':
      return <Typography component="span" className={`${classes.miniCardSubTitle} ${classes.successColor}`}>Success</Typography>
    case 'Warning':
      return <Typography component="span" className={`${classes.miniCardSubTitle} ${classes.pendingColor}`}>Warning</Typography>
    default:
      return <Typography component="span" className={`${classes.miniCardSubTitle} ${classes.unknownColor}`}>{status}</Typography>
  }
}