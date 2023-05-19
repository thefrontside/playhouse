import { makeStyles } from '@material-ui/core';
import React from 'react';
import { UpdateSystem } from '../UpdateSystem/UpdateSystem';
import { DeprecateComponent } from '../DeprecateComponent/DeprecateComponent';

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    alignItems: 'flex-start',
    '& div:first-child': {
      marginRight: theme.spacing(10)
    }
  }
}))

export function WorkflowButtonsPanel(): JSX.Element {
  const styles = useStyles();
  return (
    <div className={styles.container}>
      <UpdateSystem />
      <DeprecateComponent />
    </div>
  );
}