# backend

## 0.0.18

### Patch Changes

- Updated dependencies [d8cbd21]
  - @frontside/backstage-plugin-batch-loader@0.3.4
  - @frontside/backstage-plugin-effection-inspector-backend@0.1.8
  - @frontside/backstage-plugin-graphql@0.7.3
  - @internal/plugin-healthcheck@0.1.7
  - @frontside/backstage-plugin-humanitec-backend@0.3.8
  - @frontside/backstage-plugin-incremental-ingestion-backend@0.4.6

## 0.0.17

### Patch Changes

- 1c1b178: Upgraded to Backstage 1.12.1
- Updated dependencies [1c1b178]
  - app@0.0.9
  - @frontside/backstage-plugin-batch-loader@0.3.3
  - @frontside/backstage-plugin-effection-inspector-backend@0.1.7
  - @frontside/backstage-plugin-graphql@0.7.2
  - @internal/plugin-healthcheck@0.1.6
  - @frontside/backstage-plugin-humanitec-backend@0.3.7
  - @frontside/backstage-plugin-incremental-ingestion-backend@0.4.5

## 0.0.16

### Patch Changes

- 05f3423: Upgraded to Backstage 1.11.1
- Updated dependencies [05f3423]
- Updated dependencies [8df4163]
  - app@0.0.7
  - @frontside/backstage-plugin-batch-loader@0.3.2
  - @frontside/backstage-plugin-effection-inspector-backend@0.1.6
  - @frontside/backstage-plugin-graphql@0.7.1
  - @internal/plugin-healthcheck@0.1.5
  - @frontside/backstage-plugin-humanitec-backend@0.3.6
  - @frontside/backstage-plugin-incremental-ingestion-backend@0.4.4

## 0.0.15

### Patch Changes

- 7064aab: Backport changes from backstage graphql-plugin PR#15519
- Updated dependencies [7064aab]
  - @frontside/backstage-plugin-graphql@0.7.0

## 0.0.14

### Patch Changes

- d803873: upgrade backstage dependencies
- Updated dependencies [d803873]
  - app@0.0.6
  - @frontside/backstage-plugin-batch-loader@0.3.1
  - @frontside/backstage-plugin-effection-inspector-backend@0.1.5
  - @frontside/backstage-plugin-graphql@0.6.1
  - @internal/plugin-healthcheck@0.1.4
  - @frontside/backstage-plugin-humanitec-backend@0.3.5
  - @frontside/backstage-plugin-incremental-ingestion-backend@0.4.3

## 0.0.13

### Patch Changes

- f99de6d: Replacing batch-loader with getEntitiesByRefs from Backtage Catalog Client

  Backstage Catalog REST API is now providing an endpoint for querying entities by refs.
  This was in introduced in https://github.com/backstage/backstage/pull/14354 and
  it's available via the [Catalog API Client getEntitiesByRefs method](https://backstage.io/docs/reference/catalog-client.catalogapi.getentitiesbyrefs).

  This changes makes our `@frontside/backstage-plugin-batch-loader` unnecessary. In this release, we're deprecating
  `@frontside/backstage-plugin-batch-loader` and replacing it with native loader.

  You'll need to change your graphql plugin to pass the catalog client to the GraphQL plugin router.

- Updated dependencies [f99de6d]
- Updated dependencies [6502a7e]
  - @frontside/backstage-plugin-batch-loader@0.3.0
  - @frontside/backstage-plugin-graphql@0.6.0

## 0.0.12

### Patch Changes

- d62b0ad: Upgraded to Backstage 1.9
- Updated dependencies [f35c094]
- Updated dependencies [d62b0ad]
  - @frontside/backstage-plugin-graphql@0.5.4
  - app@0.0.5
  - @frontside/backstage-plugin-batch-loader@0.2.4
  - @frontside/backstage-plugin-effection-inspector-backend@0.1.4
  - @internal/plugin-healthcheck@0.1.3
  - @frontside/backstage-plugin-humanitec-backend@0.3.4
  - @frontside/backstage-plugin-incremental-ingestion-backend@0.4.2

## 0.0.11

### Patch Changes

- f4cd38f: Make a lot improvements to the graphql-plugin:

  - `@relation` directive supports Relay Connections
  - `@extend` directive works only on interfaces
  - `@extend` allows to declare subtypes by defining condition by `when/is` arguments
  - For each interface with `@extend` directive a new object type is generated with `-Impl` suffix
  - Exposed `transformSchema` function for creating input schema for codegen
  - Allows to specify custom data loaders
  - Union types which are used in connections are transformed to interfaces

- Updated dependencies [f4cd38f]
  - @frontside/backstage-plugin-graphql@0.5.0
  - @frontside/backstage-plugin-batch-loader@0.2.3

## 0.0.10

### Patch Changes

- ad0fde9: Upgrade backstage to 1.7 and bump effection dependencies
- Updated dependencies [ad0fde9]
- Updated dependencies [c2152b6]
  - app@0.0.4
  - @frontside/backstage-plugin-effection-inspector-backend@0.1.3
  - @frontside/backstage-plugin-graphql@0.4.2
  - @internal/plugin-healthcheck@0.1.2
  - @frontside/backstage-plugin-humanitec-backend@0.3.2
  - @frontside/backstage-plugin-incremental-ingestion-backend@0.3.0
  - @frontside/backstage-plugin-incremental-ingestion-github@0.2.2

## 0.0.9

### Patch Changes

- 2a52c92: Upgraded dependencies to bring inline with Backstage 1.6
- Updated dependencies [2a52c92]
- Updated dependencies [50f45c3]
- Updated dependencies [2cf8906]
  - app@0.0.3
  - @frontside/backstage-plugin-batch-loader@0.2.2
  - @frontside/backstage-plugin-effection-inspector-backend@0.1.2
  - @frontside/backstage-plugin-graphql@0.4.1
  - @internal/plugin-healthcheck@0.1.1
  - @frontside/backstage-plugin-humanitec-backend@0.3.1
  - @frontside/backstage-plugin-incremental-ingestion-backend@0.2.1
  - @frontside/backstage-plugin-incremental-ingestion-github@0.2.1

## 0.0.8

### Patch Changes

- Updated dependencies [5618624]
  - @frontside/backstage-plugin-batch-loader@0.2.1

## 0.0.7

### Patch Changes

- Updated dependencies [37138ae]
  - @frontside/backstage-plugin-batch-loader@0.2.0

## 0.0.6

### Patch Changes

- Updated dependencies [79a8068]
  - @frontside/backstage-plugin-graphql@0.4.0

## 0.0.5

### Patch Changes

- b26534b: Added batch-loader plugin
- Updated dependencies [b26534b]
- Updated dependencies [6ad6e23]
- Updated dependencies [5f0c2bd]
  - @frontside/backstage-plugin-batch-loader@0.1.1
  - @frontside/backstage-plugin-graphql@0.3.0

## 0.0.4

### Patch Changes

- Updated dependencies [7f8bb2b]
  - @frontside/backstage-plugin-graphql@0.2.0

## 0.0.3

### Patch Changes

- Updated dependencies [2837d26]
  - @frontside/backstage-plugin-humanitec-backend@0.3.0
  - app@0.0.2

## 0.0.2

### Patch Changes

- Updated dependencies [c3e89bd]
  - @frontside/backstage-plugin-humanitec-backend@0.2.0
  - app@0.0.1

## 0.0.1

### Patch Changes

- Updated dependencies [7a6985c]
- Updated dependencies [db53f00]
  - @frontside/backstage-plugin-effection-inspector-backend@0.1.1
