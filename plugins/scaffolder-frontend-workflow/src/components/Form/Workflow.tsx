import React from 'react';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { useCustomFieldExtensions } from '@backstage/plugin-scaffolder-react';
import {
  NextFieldExtensionOptions,
  WorkflowProps,
  useTemplateParameterSchema,
} from '@backstage/plugin-scaffolder-react/alpha';
import { ReactNode, useCallback } from 'react';
import { FormWrapper } from './FormWrapper';
import { JsonValue } from '@backstage/types';
import { useRunWorkflow } from '../../hooks/useRunWorkflow';
import { Progress } from '@backstage/core-components';
import { TaskProgress } from '../TaskProgress/TaskProgress';

type Props = Pick<
  WorkflowProps,
  'namespace' | 'templateName' | 'onCreate' | 'onError' | 'initialState'
> & { onComplete?: () => void; children: ReactNode };

export function Workflow({
  namespace,
  templateName,
  onError,
  children,
  onComplete,
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

  return (
    <>
      {loading && <Progress />}
      {manifest && (
        <FormWrapper
          extensions={customFieldExtensions}
          handleNext={handleNext}
          manifest={manifest}
          {...props}
        >
          {children}
        </FormWrapper>
      )}
      {taskStream.loading === false && <TaskProgress taskStream={taskStream} />}
    </>
  );
}
