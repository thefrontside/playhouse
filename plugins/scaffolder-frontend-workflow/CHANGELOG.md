# @frontside/backstage-plugin-scaffolder-workflow

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
