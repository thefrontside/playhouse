import React, { cloneElement } from 'react';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { useRunWorkflow } from '../../hooks';
import { WorkflowButtonProps } from './types';

export function WorkflowButton({
  onComplete,
  namespace,
  templateName,
  onError,
  components,
}: WorkflowButtonProps): JSX.Element {
  const templateRef = stringifyEntityRef({
    kind: 'Template',
    namespace: namespace,
    name: templateName,
  });

  const { taskStatus, execute, taskStream } = useRunWorkflow({
    templateRef,
    onComplete,
    onError,
  });

  let component;
  switch (taskStatus) {
    case 'idle':
      component = cloneElement(components.idle, {
        execute,
        taskStream,
      });
      break;
    case 'pending':
      component = cloneElement(components.pending, {
        taskStream,
      });
      break;
    case 'error':
      component = cloneElement(components.error, {
        taskStream,
      });
      break;
    case 'success':
      component = cloneElement(components.success, {
        taskStream,
      });
      break;
    default:
      component = <></>;
  }

  return (
    <>
      {component}
      {cloneElement(components.modal, {
        taskStatus,
        taskStream
      })}
    </>
  );
}
