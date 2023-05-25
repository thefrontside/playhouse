import React, { ReactNode, useCallback, useState } from 'react';
import { type WorkflowProps } from '@backstage/plugin-scaffolder-react/alpha';
import { Modal, ModalProps } from '../Modal/Modal';
import { Workflow } from '../Form/Workflow';

type ModalWorkflowProps = Pick<
  WorkflowProps,
  'namespace' | 'templateName' | 'onCreate' | 'initialState'
> & Pick<ModalProps, 'onClick' | 'onClose' | 'open'> & {
  children: ReactNode;
  onComplete?: () => void;
  onError?: (e: Error) => void;
  className?: string;
};

export function ModalWorkflow({
  onComplete,
  onError,
  className,
  open,
  onClick,
  onClose,
  ...props
}: ModalWorkflowProps): JSX.Element {
  const [modalExpanded, setModalExpanded] = useState(false);
  const onTaskComplete = useCallback(async () => {
    setModalExpanded(false);

    onComplete?.();
  }, [onComplete]);

  const onCloseHandler = useCallback((e) => {
    setModalExpanded(false);

    if (onClose) {
      onClose(e, "backdropClick");
    }
  }, [onClose]);

  return (
    <Modal
      open={open}
      onClick={onClick}
      onClose={onCloseHandler}
      fullyExpanded={modalExpanded}
    >
      <Workflow
        {...props}
        onTaskCreated={setModalExpanded}
        onComplete={onTaskComplete}
      />
    </Modal>
  );
}
