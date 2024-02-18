# @frontside/backstage-plugin-graphql-backend-module-catalog

## 0.2.5

### Patch Changes

- fb0e84d: Make module default exports to allow using import syntax

  This change allows to use import syntax to load modules

  ```diff
  import { createBackend } from '@backstage/backend-defaults';
  -import { graphqlPlugin } from '@frontside/backstage-plugin-graphql-backend';
  -import { graphqlModuleCatalog } from '@frontside/backstage-plugin-graphql-backend-module-catalog';

  const backend = createBackend();


  -backend.add(graphqlPlugin());
  +backend.add(import('@frontside/backstage-plugin-graphql-backend'));
  -backend.add(graphqlModuleCatalog());
  +backend.add(import('@frontside/backstage-plugin-graphql-backend-module-catalog'));

  backend.start();
  ```

- Updated dependencies [fb0e84d]
  - @frontside/backstage-plugin-graphql-backend@0.1.6

## 0.2.4

### Patch Changes

- 84f2970: Upgraded to graphql-modules 2.3.0
- Updated dependencies [84f2970]
  - @frontside/backstage-plugin-graphql-backend@0.1.5

## 0.2.3

### Patch Changes

- e3d21a3: Corrects the request type used for extracting auth token for catalog requests.

## 0.2.2

### Patch Changes

- 2124df0: Pass Backstage auth token to Catalog client requests

## 0.2.1

### Patch Changes

- d329856: Resolve node to null if entity doesn't exist

## 0.2.0

### Minor Changes

- b6f76c1: Bump Backstage to `1.20.x` along with related dependencies. This includes a bump of Knex to v3. Additionally, this version of Backstage begins to shift scaffolder alpha features into the mainline which affects the types in related packages.

### Patch Changes

- Updated dependencies [b6f76c1]
  - @frontside/backstage-plugin-graphql-backend@0.1.4

## 0.1.4

### Patch Changes

- 3d72e30: Add `encodeEntityId/decodeEntityId` helpers

## 0.1.3

### Patch Changes

- c503329: Bump Backstage to 1.18.4 and related dependencies.
- 06d6040: Updated url of repositories
- Updated dependencies [c503329]
- Updated dependencies [06d6040]
  - @frontside/backstage-plugin-graphql-backend@0.1.3

## 0.1.2

### Patch Changes

- d267d2d: Export `createCatalogLoader` function
- Updated dependencies [d267d2d]
  - @frontside/backstage-plugin-graphql-backend@0.1.2

## 0.1.1

### Patch Changes

- 33222ff: Update @frontside/hydraphql to 0.1.1
- Updated dependencies [33222ff]
  - @frontside/backstage-plugin-graphql-backend@0.1.1

## 0.1.0

### Minor Changes

- edf4591: Backport graphql plugins from Backstage PRFC [#15519](https://github.com/backstage/backstage/pull/15519)

### Patch Changes

- Updated dependencies [edf4591]
  - @frontside/backstage-plugin-graphql-backend@0.1.0
