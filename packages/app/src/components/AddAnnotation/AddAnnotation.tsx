import React, { type ReactNode } from 'react';
import { EmbeddedScaffolderWorkflow } from '@frontside/backstage-plugin-scaffolder-workflow';
import { useEntity } from '@backstage/plugin-catalog-react';
import { assert } from 'assert-ts';
import { stringifyEntityRef } from '@backstage/catalog-model';


export function AddAnnotation({ children }: {children?: ReactNode}): JSX.Element | null {

  const { entity } = useEntity();

  const entityRef = stringifyEntityRef(entity);

  const catalogInfoUrl = entity.metadata?.annotations?.['backstage.io/managed-by-origin-location'].replace(/^url:/, '')

  assert(!!catalogInfoUrl, `no catalog-info.yaml url in 'backstage.io/managed-by-origin-location' annotation`);

  const onError = (error: Error | undefined) => (
    <h2>{error?.message ?? 'Houston we have a problem.'}</h2>
  );

  return (
    <EmbeddedScaffolderWorkflow
      title="You are missing some annotation, create a PR?"
      onError={onError}
      namespace="default"
      templateName="add-annotation"
      initialState={{ catalogInfoUrl, entityRef }}
      finishPage={
        <>
          <h1>Optional Finish page</h1>
          <p>You are finished!</p>
        </>
      }
    >
      {children}
    </EmbeddedScaffolderWorkflow>
  );
}
