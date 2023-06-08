import { stringifyEntityRef } from '@backstage/catalog-model';
import { Progress } from '@backstage/core-components';
import {
  useCustomFieldExtensions,
  useCustomLayouts,
} from '@backstage/plugin-scaffolder-react';
import {
  NextFieldExtensionOptions,
  WorkflowProps as OriginalWorkflowProps,
  useTemplateParameterSchema,
} from '@backstage/plugin-scaffolder-react/alpha';
import { JsonValue } from '@backstage/types';
import React, { ReactNode, useCallback, useEffect } from 'react';

import { useRunWorkflow } from '../../hooks/useRunWorkflow';
import { TaskProgress } from '../TaskProgress/TaskProgress';
import { Form } from './Form';
import { Stepper } from './Stepper';

export type WorkflowProps = Pick<
  OriginalWorkflowProps,
  'namespace' | 'templateName' | 'onCreate' | 'initialState'
> & {
  onComplete?: () => void;
  children: JSX.Element;
  onError?: (e: Error) => void;
  onTaskCreated(loading: boolean): void;
};

export function Workflow({
  namespace,
  templateName,
  onError,
  children,
  onComplete,
  onTaskCreated,
  ...props
}: WorkflowProps): JSX.Element {
  const templateRef = stringifyEntityRef({
    kind: 'Template',
    namespace: namespace,
    name: templateName,
  });

  const customFieldExtensions =
    useCustomFieldExtensions<NextFieldExtensionOptions<any, any>>(children);

  const layouts = useCustomLayouts(children);

  const { loading, manifest } = useTemplateParameterSchema(templateRef);

  const { execute, taskStream } = useRunWorkflow({
    templateRef,
    onError,
    onComplete,
  });

  const onCreate = useCallback(
    async (formData: Record<string, JsonValue>) => {
      await execute(formData);
    },
    [execute],
  );

  useEffect(() => {
    if (taskStream.loading === false) {
      onTaskCreated(true);
    }
  }, [onTaskCreated, taskStream.loading]);

  return (
    <>
      {loading && <Progress />}
      {taskStream.loading === true && loading === false && (
        <Stepper
          manifest={manifest}
          layouts={layouts}
          extensions={customFieldExtensions}
          form={
            <Form
              extensions={customFieldExtensions}
              handleNext={onCreate}
              {...props}
            />
          }
        >
          {children}
        </Stepper>
      )}
      {taskStream.loading === false && <TaskProgress taskStream={taskStream} />}
    </>
  );
}
