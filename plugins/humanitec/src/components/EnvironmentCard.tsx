import type { FetchAppInfoEnvironment } from '@frontside/backstage-plugin-humanitec-common';
import {
  Box,
  Typography
} from '@material-ui/core';
import React, { useCallback } from 'react';
import { useStyles } from '../hooks/useStyles';
import { DeploymentStatus } from './DeploymentStatus';

interface EnvironmentCardProps {
  env: FetchAppInfoEnvironment;
  active: boolean;
  onClick: (envId: string) => void
}

export function EnvironmentCard({ env, onClick, active }: EnvironmentCardProps) {
  const classes = useStyles();

  const _onClick = useCallback(() => {
    onClick(env.id);
  }, [env, onClick])

  return (
    <Box role="button" className={`${classes.miniCard} ${active && classes.environmentCardActive}`} onClick={_onClick}>
      <Box className={classes.miniCardTitleContainer}>
        <Typography className={classes.miniCardTitle} variant="h6">{env.name}</Typography>
      </Box>
      <Typography className={classes.miniCardSubTitle} variant="subtitle1">{env.id}</Typography>
      <DeploymentStatus env={env} />
    </Box>
  )
}