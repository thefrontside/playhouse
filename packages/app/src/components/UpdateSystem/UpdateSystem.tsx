import React, { useCallback } from 'react';
import SystemUpdateIcon from '@material-ui/icons/SystemUpdate';
import { ModalWorkflow } from '@frontside/backstage-plugin-scaffolder-workflow';
import type { JsonValue } from '@backstage/types';

export function UpdateSystem(): JSX.Element {
  const onCreate = useCallback(async (values: Record<string, JsonValue>) => {
    console.log(values);
  }, []);

  const onError = (error: any) => {
    console.error(error);
    return <h1>{error.message}</h1>;
  };
  
  return (
    <ModalWorkflow
      title="System"
      tootip="Unassigned"
      onCreate={onCreate}
      onError={onError}
      namespace='default'
      templateName='update-system'
      tooltipIcon={
        <SystemUpdateIcon
          fontSize="small"
          style={{ color: 'lightblue', cursor: 'pointer' }}
        />
      }
    >
      <h2>WUT??</h2>
    </ModalWorkflow>
  );
}
