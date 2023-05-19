import React, { ReactNode, useCallback, useState } from 'react';
import {
  Box,
  Fade,
  IconButton,
  Modal,
  Tooltip,
  makeStyles,
} from '@material-ui/core';
import { WorkflowProps } from '@backstage/plugin-scaffolder-react/alpha';
import { Workflow } from '../Form/Workflow';
import cs from 'classnames';
import CloseIcon from '@material-ui/icons/Close';

const useStyles = makeStyles(theme => ({
  container: {
    '& h1': {
      margin: 0,
    },
  },
  paper: {
    position: 'absolute',
    backgroundColor: theme.palette.background.paper,
    border: '2px solid #000',
    boxShadow: theme.shadows[5],
  },
  modal: {
    maxHeight: '100%',
    maxWidth: '100%',
    position: 'fixed',
    top: '10%',
    left: '10%',
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'flex-end'
  },
  content: {
    padding: theme.spacing(2, 4, 3),
  }
}));

type ModalWorkflowProps = Pick<
  WorkflowProps,
  'namespace' | 'templateName' | 'onCreate' | 'initialState'
> & {
  children: ReactNode;
  title: string;
  tootip: ReactNode;
  tooltipIcon: ReactNode;
  tooltipTitle?: string;
  onComplete?: () => void;
  onError?: (e: Error) => void;
  className?: string;
};

export function ModalWorkflow({
  title,
  tootip,
  tooltipIcon,
  tooltipTitle = '',
  onComplete,
  onError,
  className,
  ...props
}: ModalWorkflowProps): JSX.Element {
  const styles = useStyles();
  const [modalOpen, setModalOpen] = useState(false);

  const onTaskComplete = useCallback(() => {
    setModalOpen(false);

    onComplete?.();
  }, [onComplete]);

  return (
    <>
      <Box className={cs(styles.container, className)}>
        <h1>{title}</h1>
        {tootip}
        <Tooltip title={tooltipTitle}>
          <IconButton onClick={() => setModalOpen(true)}>
            {tooltipIcon}
          </IconButton>
        </Tooltip>
      </Box>
      <Modal
        open={modalOpen}
        onClick={e => e.stopPropagation()}
        onClose={() => setModalOpen(false)}
        style={{ overflow: 'scroll' }}
      >
        <Fade in={modalOpen}>
          <div className={cs(styles.modal, styles.paper)}>
            <Box className={styles.header}>
              <IconButton onClick={() => setModalOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
            <div className={styles.content}>
              <Workflow {...props} onComplete={onTaskComplete} />
            </div>
          </div>
        </Fade>
      </Modal>
    </>
  );
}
