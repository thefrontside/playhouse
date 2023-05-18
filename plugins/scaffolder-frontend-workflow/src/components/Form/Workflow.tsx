import React from 'react';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { Progress } from '@backstage/core-components';
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

type Props = Pick<
  WorkflowProps,
  'namespace' | 'templateName' | 'onCreate' | 'onError'
> & { children: ReactNode };

export function Workflow({
  namespace,
  templateName,
  onError,
  children,
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

  const handleNext = useCallback(
    async (formData: Record<string, JsonValue> | undefined) => {
      // eslint-disable-next-line no-console
      console.log({ formData });
    },
    [],
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
