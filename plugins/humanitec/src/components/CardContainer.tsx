import React, { ReactNode } from 'react';
import { Box } from '@material-ui/core';
import { useStyles } from '../hooks/useStyles';

export function CardContainer({ children }: { children: ReactNode; }) {
  const classes = useStyles();

  return (
    <Box className={classes.container}>
      {children}
    </Box>
  );
}
