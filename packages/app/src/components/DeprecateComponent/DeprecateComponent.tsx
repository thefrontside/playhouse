import {
  ANNOTATION_ORIGIN_LOCATION,
  stringifyEntityRef,
} from '@backstage/catalog-model';
import { IconComponent, useApp } from '@backstage/core-plugin-api';
import WebIcon from '@material-ui/icons/Web';
import { useEntity } from '@backstage/plugin-catalog-react';
import { JsonValue } from '@backstage/types';
import { WorkflowButton } from '@frontside/backstage-plugin-scaffolder-workflow';
import {
  type IdleComponentType,
  type ModalComponentProps,
  type SuccessComponentProps,
  ModalTaskProgress,
} from '@frontside/backstage-plugin-scaffolder-workflow';
import { Button, makeStyles } from '@material-ui/core';
import { Link } from '@backstage/core-components';
import { assert } from 'assert-ts';
import React, { useCallback, type MouseEvent, useState } from 'react';

const useStyles = makeStyles(theme => ({
  link: {
    '&:hover': {
      textDecoration: 'none',
    },
  },
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

const Idle: IdleComponentType<{
  initialState: Record<string, JsonValue>;
}> = ({ execute, initialState }) => {
  const classes = useStyles();

  const clickHandler = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();

      // TODO: how do I make this type so it doesn't need to be optional?
      // @ts-expect-error ts(2722)
      execute(initialState);
    },
    [execute, initialState],
  );

  return (
    <Button
      variant="contained"
      color="primary"
      disableRipple
      disableFocusRipple
      type="button"
      size="medium"
      className={classes.idle}
      onClick={clickHandler}
    >
      Deprecate
    </Button>
  );
};

const Pending = () => {
  const classes = useStyles();
  return (
    <>
      <Button
        variant="contained"
        color="primary"
        disableRipple
        disableFocusRipple
        type="button"
        size="medium"
        className={classes.pending}
      >
        Running
      </Button>
    </>
  );
};

const Error = () => {
  const classes = useStyles();

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        disableRipple
        disableFocusRipple
        type="button"
        size="medium"
        className={classes.error}
      >
        Failed
      </Button>
    </>
  );
};

const Success = ({ taskStream }: SuccessComponentProps) => {
  const classes = useStyles();
  const app = useApp();
  const iconResolver = (key?: string): IconComponent =>
    app.getSystemIcon(key!) ?? WebIcon;

  return (
    <>
      {taskStream?.output?.links &&
        taskStream.output.links.map(({ url, title, icon }, i) => {
          const Icon = iconResolver(icon);

          return (
            <Link to={url ?? ''} key={i} className={classes.link}>
              <Button
                variant="contained"
                type="button"
                color="primary"
                disableRipple
                disableFocusRipple
                size="medium"
                startIcon={<Icon />}
              >
                {title}
              </Button>
            </Link>
          );
        })}
    </>
  );
};

const Modal = ({ taskStream, taskStatus }: ModalComponentProps) => {
  const [open, setOpen] = useState(false);
  const closeHandler = useCallback(() => setOpen(false), []);

  if (taskStatus !== 'idle' && taskStream) {
    return (
      <>
        <Button 
          color="secondary" 
          disableRipple
          disableFocusRipple 
          onClick={() => setOpen(true)}>
          Show Logs
        </Button>
        <ModalTaskProgress
          taskStream={taskStream}
          open={open}
          onClick={closeHandler}
          onClose={closeHandler}
        />
      </>
    );
  }

  return null;
};

export function DeprecateComponent(): JSX.Element {
  const { entity } = useEntity();

  const entityRef = stringifyEntityRef(entity);

  const url = entity.metadata?.annotations?.[
    ANNOTATION_ORIGIN_LOCATION
  ].replace(/^url:/, '');

  assert(
    !!url,
    `no catalog-info.yaml url in ${ANNOTATION_ORIGIN_LOCATION} annotation`,
  );

  return (
    <WorkflowButton
      namespace="default"
      templateName="deprecate-component"
      components={{
        idle: <Idle initialState={{ url, entityRef }} />,
        pending: <Pending />,
        error: <Error />,
        success: <Success />,
        modal: <Modal />,
      }}
    />
  );
}
