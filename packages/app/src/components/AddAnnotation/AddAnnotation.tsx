import React from 'react';
import { EmbeddedScaffolderWorkflow } from '@frontside/backstage-plugin-scaffolder-workflow';
import { Box } from '@material-ui/core';
import { JsonValue } from '@backstage/types';
import { useEntity } from '@backstage/plugin-catalog-react';

const ReviewStateComponent = () => {
  return (
    <Box display="flex" alignItems="center" flexDirection="column">
      <h1>This is a different wrapper for the review page</h1>
    </Box>
  );
};

export function AddAnnotation({
  initialState = {},
}: {
  initialState?: Record<string, JsonValue>;
}): JSX.Element | null {
  // eslint-disable-next-line no-console
  const onComplete = async () => console.log('we can add to onComplete here');

  const entity = useEntity();

  console.log(entity);

  const onError = (error: Error | undefined) => (
    <h2>{error?.message ?? 'Houston we have a problem.'}</h2>
  );

  return (
    <EmbeddedScaffolderWorkflow
      title="Altered title"
      description={`
## This is markdown
- overriding the template description
      `}
      extensions={[]}
      onCreate={onComplete}
      onError={onError}
      namespace="default"
      templateName="standard-microservice"
      /** ***
        initialState will prefill the fields in the workflow
      ******/
      // initialState={{
      //   name: 'prefilled-name',
      //   description: 'prefilled description',
      //   owner: 'acme-corp',
      //   repoUrl: 'github.com?owner=component&repo=component',
      // }}
      initialState={initialState}
      frontPage={
        <>
          <h1>Optional Front page</h1>
          <p>
            Some text
          </p>
        </>
      }
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
