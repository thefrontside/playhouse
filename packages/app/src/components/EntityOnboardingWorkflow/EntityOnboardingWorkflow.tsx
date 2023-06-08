import React, { useCallback, useState } from 'react';
import {
  ANNOTATION_ORIGIN_LOCATION,
  stringifyEntityRef,
} from '@backstage/catalog-model';
import { useEntity } from '@backstage/plugin-catalog-react';
import {
  EmbeddedScaffolderWorkflowProps,
  Workflow,
  useStepper,
} from '@frontside/backstage-plugin-scaffolder-workflow';
import { assert } from 'assert-ts';

type EntityOnboardingWorkflowProps = EmbeddedScaffolderWorkflowProps;

function OnboardingActions(props: ReturnType<typeof useStepper>) {
  console.log(props);
  return (
    <>
      <button onClick={props.handleBack}>Back</button>
      <button onClick={() => props.handleForward(props.formState)}>Forward</button>
    </>
  )
}

export function EntityOnboardingWorkflow(
  props: EntityOnboardingWorkflowProps,
): JSX.Element | null {
  const { entity } = useEntity();
  const [userInput, setUserInput] = useState();

  const entityRef = stringifyEntityRef(entity);

  const catalogInfoUrl = entity.metadata?.annotations?.[
    ANNOTATION_ORIGIN_LOCATION
  ].replace(/^url:/, '');

  assert(
    !!catalogInfoUrl,
    `no catalog-info.yaml url in ${ANNOTATION_ORIGIN_LOCATION} annotation`,
  );

  const onCreateHander = useCallback(async (formData) => {
    setUserInput(formData);
    console.log({formData});
  }, [setUserInput]);

  const onTaskCreatedHandled = useCallback(async (loading) => {
    console.log({ loading })
  }, []);

  return (
    <Workflow
      initialState={{ catalogInfoUrl, entityRef }}
      onCreate={onCreateHander}
      onTaskCreated={onTaskCreatedHandled}
      {...props}
    >
      <OnboardingActions />
    </Workflow>
  );
}
