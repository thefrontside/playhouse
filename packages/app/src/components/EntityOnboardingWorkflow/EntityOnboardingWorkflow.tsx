import {
  ANNOTATION_ORIGIN_LOCATION,
  stringifyEntityRef,
} from '@backstage/catalog-model';
import { useEntity } from '@backstage/plugin-catalog-react';
import {
  EmbeddedScaffolderWorkflow,
  EmbeddedScaffolderWorkflowProps,
} from '@frontside/backstage-plugin-scaffolder-workflow';
import { assert } from 'assert-ts';
import React from 'react';

type EntityOnboardingWorkflowProps = EmbeddedScaffolderWorkflowProps;

export function EntityOnboardingWorkflow(
  props: EntityOnboardingWorkflowProps,
): JSX.Element | null {
  const { entity } = useEntity();

  const entityRef = stringifyEntityRef(entity);

  const catalogInfoUrl = entity.metadata?.annotations?.[
    ANNOTATION_ORIGIN_LOCATION
  ].replace(/^url:/, '');

  assert(
    !!catalogInfoUrl,
    `no catalog-info.yaml url in ${ANNOTATION_ORIGIN_LOCATION} annotation`,
  );

  return (
    <EmbeddedScaffolderWorkflow
      {...props}
      initialState={{ catalogInfoUrl, entityRef }}
    />
  );
}
