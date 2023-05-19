import React, { ReactNode, useCallback, type MouseEvent } from 'react';
import { Button, makeStyles } from '@material-ui/core';
import { WorkflowProps } from '@backstage/plugin-scaffolder-react/alpha';
import cs from 'classnames';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { type TaskStatus, useRunWorkflow } from '../../hooks';
import { JsonValue } from '@backstage/types';
import { ModalTaskProgress } from '../TaskProgress/ModalTaskProgress';

type WorkflowButtonProps = Pick<
  WorkflowProps,
  'namespace' | 'templateName' | 'initialState'
> &
  Partial<Pick<WorkflowProps, 'onCreate'>> & {
    onComplete?: () => void;
    onError?: (e: Error) => void;
    buttonTexts: Record<TaskStatus, ReactNode>;
  };

const useStyles = makeStyles(theme => ({
  button: {},
  idle: {
    backgroundColor: theme.palette.primary.main,
    color: '#ffffff',
  },
  pending: {
    backgroundColor: theme.palette.warning.main,
    color: '#ffffff',
  },
  error: {
    backgroundColor: theme.palette.error.main,
    color: '#ffffff',
  },
  success: {
    backgroundColor: theme.palette.success.main,
    color: '#ffffff',
  },
}));

export function WorkflowButton({
  onComplete,
  namespace,
  templateName,
  buttonTexts,
  initialState,
  onError,
}: WorkflowButtonProps): JSX.Element {
  const styles = useStyles();
  const templateRef = stringifyEntityRef({
    kind: 'Template',
    namespace: namespace,
    name: templateName,
  });

  const { taskStatus, execute, taskStream } = useRunWorkflow({
    templateRef,
    onComplete,
    onError,
  });

  const clickHandler = useCallback(
    async (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();

      await execute(initialState as Record<string, JsonValue>);
    },
    [execute, initialState],
  );

  return (
    <div>
      <Button
        variant="contained"
        color="primary"
        className={cs({
          [styles.idle]: taskStatus === 'idle',
          [styles.pending]: taskStatus === 'pending',
          [styles.error]: taskStatus === 'error',
          [styles.success]: taskStatus === 'success',
        })}
        type="button"
        onClick={clickHandler}
        disableRipple
        disableFocusRipple
        size="medium"
      >
        {buttonTexts[taskStatus]}
      </Button>
      {taskStream.loading === false && (
        <ModalTaskProgress taskStream={taskStream} />
      )}
    </div>
  );
}
