import React, { useState, type ReactNode, useCallback } from 'react';
import {
  Box,
  Fade,
  IconButton,
  Modal as MuiModal,
  type ModalProps as MuiModalProps,
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
  header: {
    display: 'flex',
    justifyContent: 'flex-end',
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

export interface ModalProps {
  open: boolean;
  onClick: MuiModalProps['onClick'];
  onClose: MuiModalProps['onClose'];
  fullyExpanded?: boolean;
  children: ReactNode;
}


export function Modal({
  children,
  fullyExpanded = false,
  open,
  onClick,
  onClose
}: ModalProps): JSX.Element {
  const styles = useStyles();

  return (
    <MuiModal
      open={open}
      onClick={onClick}
      onClose={onClose}
      style={{ overflow: 'scroll' }}
      keepMounted={false}
    >
      <Fade in={open}>
        <div
          className={cs(styles.modal, styles.paper, {
            [styles.fullyExpanded]: fullyExpanded,
          })}
        >
          <Box className={styles.header}>
            <IconButton onClick={(e) => onClose && onClose(e, "backdropClick")}>
              <CloseIcon />
            </IconButton>
          </Box>
          {children}
        </div>
      </Fade>
    </MuiModal>
  );
}
