import React, { useState } from 'react';
import {
  Box,
  Fade,
  IconButton,
  Modal,
  Tooltip,
  makeStyles,
} from '@material-ui/core';
import cs from 'classnames';
import { TaskProgress, TaskProgressProps } from './TaskProgress';
import ViewStream from '@material-ui/icons/ViewStream';

const useStyles = makeStyles(theme => ({
  paper: {
    position: 'absolute',
    backgroundColor: theme.palette.background.paper,
    border: '2px solid #000',
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
  },
  modal: {
    maxHeight: '100%',
    maxWidth: '100%',
    position: 'fixed',
    top: '10%',
    left: '10%',
    overflowY: 'auto',
  },
  icon: {
    paddingTop: '5px',
  },
}));

export function ModalTaskProgress({
  taskStream,
}: TaskProgressProps): JSX.Element {
  const styles = useStyles();
  const [modalOpen, setModalOpen] = useState(false);

  const { width, height } = taskStream.loading
    ? { width: 'auto', height: 'auto' }
    : {
        width: Math.max(window.innerWidth / 2, 500),
        height: Math.max(window.innerHeight / 2, 650),
      };

  return (
    <>
      <Box>
        <div>
          <span>View Logs</span>
          <Tooltip title="View Logs">
            <IconButton
              style={{ color: 'lightblue', cursor: 'pointer' }}
              className={styles.icon}
              onClick={() => setModalOpen(true)}
            >
              <ViewStream />
            </IconButton>
          </Tooltip>
        </div>
      </Box>
      <Modal
        open={modalOpen}
        onClick={e => e.stopPropagation()}
        onClose={() => setModalOpen(false)}
        style={{ overflow: 'scroll' }}
      >
        <Fade in={modalOpen}>
          <div
            style={{ width, height }}
            className={cs(styles.modal, styles.paper)}
          >
            <TaskProgress taskStream={taskStream} />
          </div>
        </Fade>
      </Modal>
    </>
  );
}
