import React, { useState } from 'react';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { Progress } from '@backstage/core-components';
import { errorApiRef, useApi } from '@backstage/core-plugin-api';
import {
  scaffolderApiRef,
  useCustomFieldExtensions,
  useTemplateSecrets,
} from '@backstage/plugin-scaffolder-react';
import {
  NextFieldExtensionOptions,
  WorkflowProps,
  useTemplateParameterSchema,
} from '@backstage/plugin-scaffolder-react/alpha';
import { ReactNode, useCallback, useEffect } from 'react';
import { FormWrapper } from './FormWrapper';
import { JsonValue } from '@backstage/types';
import { useAsync } from '@react-hookz/web';

type Props = Pick<
  WorkflowProps,
  'namespace' | 'templateName' | 'onCreate' | 'onError' | 'initialState'
> & { children: ReactNode };

export function Workflow({
  namespace,
  templateName,
  onError,
  children,
  ...props
}: Props): JSX.Element {
  const errorApi = useApi(errorApiRef);
  const scaffolderApi = useApi(scaffolderApiRef);
  const [taskId, setTaskId] = useState<string>();
  const customFieldExtensions =
    useCustomFieldExtensions<NextFieldExtensionOptions<any, any>>(children);
  const { secrets } = useTemplateSecrets();
  const templateRef = stringifyEntityRef({
    kind: 'Template',
    namespace: namespace,
    name: templateName,
  });

  const { loading, manifest, error } = useTemplateParameterSchema(templateRef);

  const [state, { execute }] = useAsync(async function runScaffolderWorkflow({
    values,
  }) {
    const { taskId: id } = await scaffolderApi.scaffold({
      templateRef,
      values,
      secrets,
    });

    setTaskId(id);
  });

  const handleNext = useCallback(
    async (formData: Record<string, JsonValue> | undefined) => {
      // eslint-disable-next-line no-console
      console.log({ formData });

      await execute(formData as any);
    },
    [execute],
  );

  useEffect(() => {
    if (error) {
      errorApi.post(new Error(`Failed to load template, ${error}`));
    }
  }, [error, errorApi]);

  // eslint-disable-next-line no-console
  console.log({ state, taskId });

  return (
    <>
      {loading && <Progress />}
      {error && onError(error)}
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
    </>
  );
}
