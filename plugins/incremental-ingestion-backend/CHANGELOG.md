# @frontside/backstage-plugin-incremental-ingestion-backend

## 0.5.0

### Minor Changes

- b6f76c1: Bump Backstage to `1.20.x` along with related dependencies. This includes a bump of Knex to v3. Additionally, this version of Backstage begins to shift scaffolder alpha features into the mainline which affects the types in related packages.

## 0.4.9

### Patch Changes

- c503329: Bump Backstage to 1.18.4 and related dependencies.

## 0.4.8

### Patch Changes

- edf4591: Backport graphql plugins from Backstage PRFC [#15519](https://github.com/backstage/backstage/pull/15519)

## 0.4.7

### Patch Changes

- 181c413: Upgraded to Backstage 1.17

## 0.4.6

### Patch Changes

- d8cbd21: bump backstage

## 0.4.5

### Patch Changes

- 1c1b178: Upgraded to Backstage 1.12.1

## 0.4.4

### Patch Changes

- 05f3423: Upgraded to Backstage 1.11.1

## 0.4.3

### Patch Changes

- d803873: upgrade backstage dependencies

## 0.4.2

### Patch Changes

- d62b0ad: Upgraded to Backstage 1.9

## 0.4.1

### Patch Changes

- 83910a8: catch handler in the IncrementalIngestianEngine is wrongly assuming an error to be a string

## 0.4.0

### Minor Changes

- bde7974: ensure completion_ticket is used for incremental ingestions

## 0.3.2

### Patch Changes

- b1a2d5d: Revert change to the prepack script based on https://github.com/thefrontside/actions/pull/89

## 0.3.1

### Patch Changes

- b961522: call build from prepack in @frontside/backstage-plugin-incremental-ingestion-backend

## 0.3.0

### Minor Changes

- c2152b6: sync backstage-plugin-incremental-ingestion-backend with backstage PR

### Patch Changes

- ad0fde9: Upgrade backstage to 1.7 and bump effection dependencies

## 0.2.1

### Patch Changes

- 2a52c92: Upgraded dependencies to bring inline with Backstage 1.6
- 50f45c3: Fix deletion query
- 2cf8906: Add indexes to ingestion tables to improve performance

## 0.2.0

### Minor Changes

- ed2a1a6: Initial release of @frontside/backstage-plugin-incremental-ingestion-backend

## 0.1.1

### Patch Changes

- a8dd8bd: Resolving mutations from correct package name
- 7886c2d: Add backstage incremental ingestion backend plugin
