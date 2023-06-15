import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import { type WorkflowProps } from '@backstage/plugin-scaffolder-react/alpha';
import { Modal, ModalProps } from '../Modal/Modal';
import { Workflow } from '../Workflow';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { useRunWorkflow, useWorkflowManifest } from '../../hooks';

type ModalWorkflowProps = Pick<
  WorkflowProps,
  'namespace' | 'templateName' | 'onCreate' | 'initialState'
> &
  Pick<ModalProps, 'onClick' | 'onClose' | 'open'> & {
    children: ReactNode;
    onComplete?: () => void;
    onError?: (e: Error) => void;
    className?: string;
  };

export function ModalWorkflow({
  namespace,
  templateName,
  onComplete,
  onError,
  className,
  open,
  onClick,
  onClose,
  ...props
}: ModalWorkflowProps): JSX.Element | null {
  const [modalExpanded, setModalExpanded] = useState(false);

  const templateRef = stringifyEntityRef({
    kind: 'Template',
    namespace: namespace,
    name: templateName,
  });

  const { loading, manifest } = useWorkflowManifest({
    name: templateName,
    namespace: namespace,
  });

  const onTaskComplete = useCallback(async () => {
    onComplete?.();
  }, [onComplete]);

  const onCloseHandler = useCallback(
    e => {
      setModalExpanded(false);

      if (onClose) {
        onClose(e, 'backdropClick');
      }
    },
    [onClose],
  );

  const workflow = useRunWorkflow({
    templateRef,
    onComplete: onTaskComplete,
  });

  useEffect(() => {
    if (workflow.taskStream.loading === false) {
      setModalExpanded(true);
    }
  }, [workflow.taskStream.loading]);

  if (loading) {
    return <>Loading template...</>;
  }

  return manifest ? (
    <Modal
      open={open}
      onClick={onClick}
      onClose={onCloseHandler}
      fullyExpanded={modalExpanded}
    >
      <Workflow {...props} manifest={manifest} workflow={workflow} />
    </Modal>
  ) : null;
}
