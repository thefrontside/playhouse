import { stringifyEntityRef } from '@backstage/catalog-model';
import { Progress } from '@backstage/core-components';
import { useCustomFieldExtensions } from '@backstage/plugin-scaffolder-react';
import {
  NextFieldExtensionOptions,
  WorkflowProps as OriginalWorkflowProps,
  useTemplateParameterSchema,
} from '@backstage/plugin-scaffolder-react/alpha';
import { JsonValue } from '@backstage/types';
import React, { ReactNode, useCallback, useEffect } from 'react';

import { useRunWorkflow } from '../../hooks/useRunWorkflow';
import { useStepper } from '../../hooks/useStepper';
import { TaskProgress } from '../TaskProgress/TaskProgress';
import { Form } from './Form';

export type WorkflowProps = Pick<
  OriginalWorkflowProps,
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
}: WorkflowProps): JSX.Element {
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

  const stepper = useStepper({ 
    manifest,
    extensions: customFieldExtensions,
    initialState: props.initialState,
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
      {taskStream.loading === true && (
        <Form
          extensions={customFieldExtensions}
          handleNext={onCreate}
          step={stepper.currentStep}
          {...props}
        >
          {children}
        </Form>
      )}
      {taskStream.loading === false && <TaskProgress taskStream={taskStream} />}
    </>
  );
}
