import React, { useState, type ReactNode, useCallback } from 'react';
import {
  Box,
  Fade,
  IconButton,
  Modal as MuiModal,
  Tooltip,
  makeStyles,
} from '@material-ui/core';
import cs from 'classnames';
import CloseIcon from '@material-ui/icons/Close';

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
  header: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  content: {
    padding: theme.spacing(2, 4, 3),
  },
  fullyExpanded: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    margin: '2rem',
  },
}));

interface ModalProps {
  title: string;
  icon: ReactNode;
  fullyExpanded?: boolean;
  onClose?: () => void;
  children: ReactNode;
}

type ModalState = 'initial' | 'open' | 'closed';

export function Modal({
  title,
  icon,
  children,
  fullyExpanded = false,
  onClose,
}: ModalProps): JSX.Element {
  const [modalState, setModalState] = useState<ModalState>('initial');
  const styles = useStyles();

  const closeHandler = useCallback(() => {
    setModalState('closed');
    onClose?.();
  }, [onClose]);

  return (
    <>
      <Box>
        <div>
          <span>{title}</span>
          <Tooltip title={title}>
            <IconButton
              style={{ color: 'lightblue', cursor: 'pointer' }}
              className={styles.icon}
              onClick={() => setModalState('open')}
            >
              {icon}
            </IconButton>
          </Tooltip>
        </div>
      </Box>
      <MuiModal
        open={modalState === 'open'}
        onClick={e => e.stopPropagation()}
        onClose={closeHandler}
        style={{ overflow: 'scroll' }}
        keepMounted={false}
      >
        <Fade in={modalState === 'open'}>
          <div
            className={cs(styles.modal, styles.paper, {
              [styles.fullyExpanded]: fullyExpanded,
            })}
          >
            <Box className={styles.header}>
              <IconButton onClick={closeHandler}>
                <CloseIcon />
              </IconButton>
            </Box>
            {children}
          </div>
        </Fade>
      </MuiModal>
    </>
  );
}
