# @frontside/backstage-plugin-scaffolder-workflow

## 0.10.2

### Patch Changes

- 870b26c: Update backstage deps

## 0.10.1

### Patch Changes

- f9b16e1: Update backstage dependencies

## 0.10.0

### Minor Changes

- d578189: Allow passing formContext through the FormProps to scaffolder form.

## 0.9.0

### Minor Changes

- b6f76c1: Bump Backstage to `1.20.x` along with related dependencies. This includes a bump of Knex to v3. Additionally, this version of Backstage begins to shift scaffolder alpha features into the mainline which affects the types in related packages.

## 0.8.1

### Patch Changes

- c503329: Bump Backstage to 1.18.4 and related dependencies.

## 0.8.0

### Minor Changes

- 16099d1: Async validation is now scoped to only run for the current step. Allow Scaffolder to run validation at the root of an object.

## 0.7.2

### Patch Changes

- 181c413: Upgraded to Backstage 1.17

## 0.7.1

### Patch Changes

- 2a01546: Removed unnecessary dependency on@backstage/plugin-scaffolder

## 0.7.0

### Minor Changes

- f84fa9a: Expose the FormComponent to improve ability to customize the DOM layout and styling.

### Patch Changes

- 636a98f: Provide a method in the `useRunWorkflow` hook to `reset()` the state.

## 0.6.0

### Minor Changes

- ed36b96: Updated the Workflow component and related hooks to enable fully creating the Scaffolder form customizable in userland. This includes breaking changes to Workflow, new hooks to handle validation, and an update to useStepper to support that validation.

## 0.5.0

### Minor Changes

- 6ab2913: Rely on App provided Scaffolder Secret Context

## 0.4.0

### Minor Changes

- 7bbd121: Add inline and modal embedded scaffolders

## 0.3.7

### Patch Changes

- d8cbd21: bump backstage

## 0.3.6

### Patch Changes

- 40bcaab: Unwrap LogViewer component to eliminate extra div

## 0.3.5

### Patch Changes

- 04dda7f: Renamed override type to match actual name EmbeddedScaffolderTaskProgress

## 0.3.4

### Patch Changes

- cb196e2: To fix a bug in one of our client's Backstage sites that use EmbeddedScaffolder where the results page doesn't show the logs. This is happening because the page doesn't properly take full height and automatically adjust the height of the log area.

  1. Use `makeStyles` to create a style that can be overwritten by ovewritting style name `EmbeddedScaffolderTaskProgress`
  2. Added padding bottom to TaskSteps to separate it from step output
  3. Added `flexGrow: 2` to log container box
  4. Added export for EmbeddedScaffolderOverrides with types for TaskProgress

## 0.3.3

### Patch Changes

- 10104ef: Allow passing in useTemplateSecrets to enable use of context higher up in the component tree.

## 0.3.2

### Patch Changes

- 5076f9c: Eliminate route ref from embedded scaffolder workflow

## 0.3.1

### Patch Changes

- 1c1b178: Upgraded to Backstage 1.12.1

## 0.3.0

### Minor Changes

- c9a3b3b: Add TaskProgress component with OngoingTask components

## 0.2.2

### Patch Changes

- 05f3423: Upgraded to Backstage 1.11.1

## 0.2.1

### Patch Changes

- d5e5f2b: call scaffold from embedded scaffolder workflow

## 0.2.0

### Minor Changes

- c9b79f1: Add EmbeddedScaffolderWorkflow package
