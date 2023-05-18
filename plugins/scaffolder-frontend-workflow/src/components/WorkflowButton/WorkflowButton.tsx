import React, {
  ReactNode,
  useCallback,
  useState,
  type MouseEvent,
  useEffect,
} from 'react';
import { Button, makeStyles } from '@material-ui/core';
import { WorkflowProps } from '@backstage/plugin-scaffolder-react/alpha';
import cs from 'classnames';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { useRunWorkflow } from '../../hooks';
import { useTaskEventStream } from '@backstage/plugin-scaffolder-react';
import { JsonValue } from '@backstage/types';

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

type State = 'LOADING' | 'SUCCESS' | 'ERROR';

type ButtonProgressProps = {
  taskId: string;
  onComplete: () => void;
} & Pick<WorkflowButtonProps, 'buttonTexts' | 'onComplete' | 'onError'>;

export function ButtonProgress({
  taskId,
  onComplete,
  buttonTexts,
}: ButtonProgressProps) {
  const styles = useStyles();
  const [state, setState] = useState<State>('LOADING');
  const taskStream = useTaskEventStream(taskId);

  useEffect(() => {
    if (taskStream.error) {
      // eslint-disable-next-line no-console
      console.error(taskStream.error);
      setState('ERROR');
      return;
    }

    if (taskStream.completed) {
      setState('SUCCESS');
      onComplete?.();
      return;
    }
  }, [onComplete, taskStream.completed, taskStream.error]);

  return (
    <Button
      variant="contained"
      className={cs({
        [styles.loading]: state === 'LOADING',
        [styles.error]: state === 'ERROR',
        [styles.success]: state === 'SUCCESS',
      })}
      type="button"
      disableRipple
      disableFocusRipple
      size="medium"
    >
      {buttonTexts[state.toLowerCase() as keyof typeof buttonTexts] ?? buttonTexts.loading}
    </Button>
  );
}

export function WorkflowButton({
  onComplete,
  namespace,
  templateName,
  buttonTexts,
  initialState
}: WorkflowButtonProps): JSX.Element {
  const styles = useStyles();
  const templateRef = stringifyEntityRef({
    kind: 'Template',
    namespace: namespace,
    name: templateName,
  });

  const { state, execute, taskId } = useRunWorkflow({ templateRef });

  const taskCompleteHandler = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  const clickHandler = useCallback(
    async (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();

      await execute(initialState as Record<string, JsonValue>);
    },
    [execute, initialState],
  );

  return (
    <>
      {!taskId && (
        <Button
          variant="contained"
          color="primary"
          className={cs({
            [styles.default]: !state.error,
            [styles.error]: !!state.error
          })}
          type="button"
          onClick={clickHandler}
          disableRipple
          disableFocusRipple
          size="medium"
        >
          {buttonTexts.default}
        </Button>
      )}
      {taskId && (
        <ButtonProgress
          taskId={taskId}
          onComplete={taskCompleteHandler}
          buttonTexts={buttonTexts}
        />
      )}
    </>
  );
}
