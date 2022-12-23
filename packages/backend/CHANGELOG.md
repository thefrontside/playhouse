# backend

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
