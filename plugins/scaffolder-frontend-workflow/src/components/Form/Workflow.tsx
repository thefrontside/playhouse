import React from 'react';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { errorApiRef, useApi } from '@backstage/core-plugin-api';
import { useCustomFieldExtensions } from '@backstage/plugin-scaffolder-react';
import {
  NextFieldExtensionOptions,
  WorkflowProps,
  useTemplateParameterSchema,
} from '@backstage/plugin-scaffolder-react/alpha';
import { ReactNode, useCallback, useEffect } from 'react';
import { FormWrapper } from './FormWrapper';
import { JsonValue } from '@backstage/types';
import { useRunWorkflow } from '../../hooks/useRunWorkflow';
import { TaskProgress } from './Progress';
import { Progress } from '@backstage/core-components';

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
  const errorApi = useApi(errorApiRef);
  const customFieldExtensions =
    useCustomFieldExtensions<NextFieldExtensionOptions<any, any>>(children);
  const templateRef = stringifyEntityRef({
    kind: 'Template',
    namespace: namespace,
    name: templateName,
  });

  const { loading, manifest, error } = useTemplateParameterSchema(templateRef);

  const { state, execute, taskId } = useRunWorkflow({ templateRef });

  const handleNext = useCallback(
    async (formData: Record<string, JsonValue>) => {
      await execute(formData);
    },
    [execute],
  );

  useEffect(() => {
    if (error) {
      errorApi.post(new Error(`Failed to load template, ${error}`));
    }
  }, [error, errorApi]);

  return (
    <>
      {loading && <Progress />}
      {error && onError(error)}
      {state.error && onError(state.error)}
      {taskId && <TaskProgress taskId={taskId} onComplete={onComplete} />}
      {manifest && !taskId && (
        <FormWrapper
          extensions={customFieldExtensions}
          handleNext={handleNext}
          manifest={manifest}
          {...props}
        >
          {children}
        </FormWrapper>
      )}
    </>
  );
}
