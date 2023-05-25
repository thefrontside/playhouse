# @backstage/plugin-scaffolder-react
## Why?
Scaffolder workflows are one of the focal points of [backstage](https://backstage.io/) that alleviates the pain of writing boilerplate code for almost any situation.

Running scaffolder workflows outside of their current backstage location is impossible, and we would like to run scaffolder workflows in just about any react component in a backstage instance.

This repo provides the building blocks to do just that and components that enable scaffolder workflows to run in different scenarios.

## Getting started

```sh
# npm
npm install @backstage/plugin-scaffolder-react

# yarn
yarn add @backstage/plugin-scaffolder-react

#pnpm
pnpm add @backstage/plugin-scaffolder-react
```

## Hooks
[useRunWorkflow](./hooks/useRunWorkflow.ts) - Kicks off a scaffolder workflow, and it returns a `taskStream` of workflow events
```ts
const templateRef = stringifyEntityRef({
  kind: 'Template',
  namespace: 'default',
  name: 'update-system',
});

const { taskStatus, execute, taskStream } = useRunWorkflow({
  templateRef,
  onComplete,
  onError,
});
```
[useStepper](./hooks/useStepper) - Keep track of the workflow steps outside of a component instance:
```ts
  const templateRef = stringifyEntityRef({
    kind: 'Template',
    namespace: 'default',
    name: 'update-system',
  });

  const { loading, manifest } = useTemplateParameterSchema(templateRef);

const { currentStep } = useStepper({ manifest });
```
## Components
[ModalWorkflow](./src/components/ModalWorkflow/ModalWorkflow.tsx) - Kick off a scaffolder workflow by clicking a link and running the workflow form in a modal:

[demo](./docs/modal.mp4)

```ts
<>
  {entity?.spec?.system ? entity.spec.system : 'System not specified.'}
  <Tooltip title="Assign System">
    <IconButton aria-label="Assign System" color="primary" onClick={() => setOpen(true)}>
      <SystemUpdateIcon />
    </IconButton>
  </Tooltip>
  <ModalWorkflow
    open={open}
    onClick={() => {}}
    onClose={closeHandler}
    onCreate={onCreate}
    namespace="default"
    templateName="update-system"
    initialState={{ url, entityRef, system: entity?.spec?.system ?? '' }}
    onError={(_e) => {
      // eslint-disable-next-line no-console
      console.log('optional error handler')
    }}
  >
    <ScaffolderFieldExtensions>
      <EntityPickerFieldExtension />
    </ScaffolderFieldExtensions>
    <Button
      variant="contained"
      color="primary"
      type="submit"
      onClick={onCreate as any}
    >
      Link
    </Button>
  </ModalWorkflow>
</>
```

[WorkflowButton](./src/components/WorkflowButton/WorkflowButton.tsx) - If there are no form elements or no user input is required, then a scaffolder workflow can be executed via a simple button click and the button has props to display state change messaging:

[demo](./demo/button.mp4)

```ts
<WorkflowButton
  namespace="default"
  templateName="deprecate-component"
  components={{
    idle: <Idle initialState={{ url, entityRef }} />,
    pending: <Pending />,
    error: <Error />,
    success: <Success />,
    modal: <Modal />,
  }}
/>
```

[EmbeddedScaffolderWorkflow](./src/components/EmbeddedScaffolderWorkflow/EmbeddedScaffolderWorkflow.tsx) - A lot like the traditional scaffolder workflow only it is a regular component that can be added to different place in the backstage instance.
```ts
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
```

