import React from 'react';
import { TaskProgress, TaskProgressProps } from './TaskProgress';
import ViewStream from '@material-ui/icons/ViewStream';
import { Modal } from '../Modal/Modal'

export function ModalTaskProgress({
  taskStream,
}: TaskProgressProps): JSX.Element {

  return (
    <Modal
      title='View Logs'
      icon={<ViewStream />}
      fullyExpanded
    >
      <TaskProgress taskStream={taskStream} />
    </Modal>
  );
}
