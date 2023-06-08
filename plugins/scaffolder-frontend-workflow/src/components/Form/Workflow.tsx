import React, { useEffect } from 'react';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { useCustomFieldExtensions } from '@backstage/plugin-scaffolder-react';
import {
  NextFieldExtensionOptions,
  WorkflowProps,
  useTemplateParameterSchema,
} from '@backstage/plugin-scaffolder-react/alpha';
import { ReactNode, useCallback } from 'react';
import { JsonValue } from '@backstage/types';
import { useRunWorkflow } from '../../hooks/useRunWorkflow';
import { Progress } from '@backstage/core-components';
import { TaskProgress } from '../TaskProgress/TaskProgress';
import { Form } from './Form';

type Props = Pick<
  WorkflowProps,
  'namespace' | 'templateName' | 'onCreate' | 'initialState'
> & {
  onComplete?: () => void;
  children: ReactNode;
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
}: Props): JSX.Element {
  const customFieldExtensions =
    useCustomFieldExtensions<NextFieldExtensionOptions<any, any>>(children);

  const templateRef = stringifyEntityRef({
    kind: 'Template',
    namespace: namespace,
    name: templateName,
  });

  const { loading, manifest } = useTemplateParameterSchema(templateRef);

  const { execute, taskStream } = useRunWorkflow({
    templateRef,
    onError,
    onComplete,
  });

  const handleNext = useCallback(
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
      {manifest && taskStream.loading === true && (
        <Form
          extensions={customFieldExtensions}
          handleNext={handleNext}
          {...props}
        >
          {children}
        </Form>
      )}
      {taskStream.loading === false && <TaskProgress taskStream={taskStream} />}
    </>
  );
}
