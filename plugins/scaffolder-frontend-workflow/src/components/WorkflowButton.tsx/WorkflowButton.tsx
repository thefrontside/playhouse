import React, {
  ReactNode,
  useCallback,
  type MouseEvent,
} from 'react';
import { Button, makeStyles } from '@material-ui/core';
import { WorkflowProps } from '@backstage/plugin-scaffolder-react/alpha';
import cs from 'classnames';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { useRunWorkflow } from '../../hooks';
import { JsonValue } from '@backstage/types';
import { ModalTaskProgress } from '../TaskProgress/ModalTaskProgress';

type WorkflowButtonProps = Pick<
  WorkflowProps,
  'namespace' | 'templateName' | 'initialState'
> &
  Partial<Pick<WorkflowProps, 'onCreate' | 'onError'>> & {
    onComplete?: () => void;
    buttonTexts: {
      default: ReactNode;
      loading: ReactNode;
      error: ReactNode;
      success: ReactNode;
    };
  };

const useStyles = makeStyles(theme => ({
  button: {},
  default: {
    backgroundColor: theme.palette.primary.main,
    color: '#ffffff',
  },
  loading: {
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
  onError
}: WorkflowButtonProps): JSX.Element {
  const styles = useStyles();
  const templateRef = stringifyEntityRef({
    kind: 'Template',
    namespace: namespace,
    name: templateName,
  });

  const { taskStatus, execute, taskStream } = useRunWorkflow({ templateRef, onComplete, onError });

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
          [styles.default]: taskStatus === 'not-executed',
          [styles.loading]: taskStatus === 'pending',
          [styles.error]: taskStatus === 'error',
          [styles.success]: taskStatus === 'success',
        })}
        type="button"
        onClick={clickHandler}
        disableRipple
        disableFocusRipple
        size="medium"
      >
        {buttonTexts.default}
      </Button>
      {taskStream.loading === false && <ModalTaskProgress taskStream={taskStream} />}
    </div>
  );
}
