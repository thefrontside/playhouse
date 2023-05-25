import React from 'react';
import { TaskProgress, TaskProgressProps } from './TaskProgress';
import { Modal, ModalProps } from '../Modal/Modal'

export function ModalTaskProgress({
  taskStream,
  open,
  onClick,
  onClose
}: TaskProgressProps & Omit<ModalProps, 'children'>): JSX.Element {
  return (
    <Modal
      open={open}
      onClick={onClick}
      onClose={onClose}
      fullyExpanded
    >
      <TaskProgress taskStream={taskStream} />
    </Modal>
  );
}
