import React, { ReactNode, useCallback, useState } from 'react';
import { type WorkflowProps } from '@backstage/plugin-scaffolder-react/alpha';
import { Modal } from '../Modal/Modal';
import { Workflow } from '../Form/Workflow';

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
  const [modalExpanded, setModalExpanded] = useState(false);
  const onTaskComplete = useCallback(async () => {
    setModalExpanded(false);

    onComplete?.();
  }, [onComplete]);

  return (
    <Modal
      title={title}
      icon={tooltipIcon}
      fullyExpanded={modalExpanded}
      onClose={() => setModalExpanded(false)}
    >
      <Workflow
        {...props}
        onTaskCreated={setModalExpanded}
        onComplete={onTaskComplete}
      />
    </Modal>
  );
}
