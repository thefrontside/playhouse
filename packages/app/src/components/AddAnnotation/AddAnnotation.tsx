import React from 'react';
import { EmbeddedScaffolderWorkflow } from '@frontside/backstage-plugin-scaffolder-workflow';
import { Box } from '@material-ui/core';
import { useEntity } from '@backstage/plugin-catalog-react';
import { assert } from 'assert-ts';

const ReviewStateComponent = () => {
  return (
    <Box display="flex" alignItems="center" flexDirection="column">
      <h1>This is a different wrapper for the review page</h1>
    </Box>
  );
};

export function AddAnnotation(): JSX.Element | null {
  // eslint-disable-next-line no-console
  const onComplete = async () => console.log('we can add to onComplete here');

  const { entity } = useEntity();

  const catalogInfoUrl = entity.metadata?.annotations?.['backstage.io/managed-by-origin-location'].replace(/^url:/, '')

  assert(!!catalogInfoUrl, `no catalog-info.yaml url in 'backstage.io/managed-by-origin-location' annotation`);

  console.log(catalogInfoUrl)

  const onError = (error: Error | undefined) => (
    <h2>{error?.message ?? 'Houston we have a problem.'}</h2>
  );

  return (
    <EmbeddedScaffolderWorkflow
      title="You are missing some annotation, create a PR?"
      extensions={[]}
      onCreate={onComplete}
      onError={onError}
      namespace="default"
      templateName="add-annotation"
      initialState={{ catalogInfoUrl }}
      finishPage={
        <>
          <h1>Optional Finish page</h1>
          <p>You are finished!</p>
        </>
      }
      components={{
        ReviewStateComponent,
      }}
    />
  );
}
