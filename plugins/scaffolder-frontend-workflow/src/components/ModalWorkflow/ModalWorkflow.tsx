import React, { ReactNode, useState } from 'react';
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

const useStyles = makeStyles(theme => ({
  paper: {
    position: 'absolute',
    width: 400,
    backgroundColor: theme.palette.background.paper,
    border: '2px solid #000',
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
  },
  modal: {
    maxHeight: '100%',
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(0, -50%)',
    overflowY: 'auto',
  },
}));

type ModalWorkflowProps = Pick<
  WorkflowProps,
  'namespace' | 'templateName' | 'onCreate' | 'onError' | 'initialState'
> & {
  children: ReactNode;
  title: string;
  tootip: ReactNode;
  tooltipIcon: ReactNode;
  tooltipTitle?: string;
};

export function ModalWorkflow({
  title,
  tootip,
  tooltipIcon,
  tooltipTitle = '',
  ...props
}: ModalWorkflowProps): JSX.Element {
  const styles = useStyles();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <h1>{title}</h1>
      <Box display="flex" alignItems="center">
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
            <Workflow {...props} />
          </div>
        </Fade>
      </Modal>
    </>
  );
}
