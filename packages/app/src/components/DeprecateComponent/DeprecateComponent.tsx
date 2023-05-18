import React from 'react';
import {
  ANNOTATION_ORIGIN_LOCATION,
  stringifyEntityRef,
} from '@backstage/catalog-model';
import { useEntity } from '@backstage/plugin-catalog-react';
import { WorkflowButton } from '@frontside/backstage-plugin-scaffolder-workflow';
import { assert } from 'assert-ts';

export function DeprecateComponent(): JSX.Element {
  const { entity } = useEntity();

  const entityRef = stringifyEntityRef(entity);

  const url = entity.metadata?.annotations?.[
    ANNOTATION_ORIGIN_LOCATION
  ].replace(/^url:/, '');

  assert(
    !!url,
    `no catalog-info.yaml url in ${ANNOTATION_ORIGIN_LOCATION} annotation`,
  );

  return (
    <WorkflowButton
      namespace="default"
      templateName="deprecate-component"
      initialState={{ url, entityRef }}
      buttonTexts={{
        default: 'Promote',
        loading: 'Promoting',
        error: 'Failed',
        success: 'Promoted',
      }}
    />
  );
}
