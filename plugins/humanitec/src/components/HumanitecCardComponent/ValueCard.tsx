import React from 'react';
import { Typography } from '@material-ui/core';
import { useStyles } from './useStyles';

export function ValueCard({ label, value }: { label?: string; value?: string | JSX.Element; }) {
  const classes = useStyles();
  return (
    <>
      <Typography variant="h2" className={classes.label}>
        {label}
      </Typography>
      <Typography variant="body2" className={classes.value}>
        {value}
      </Typography>
    </>
  );
}
