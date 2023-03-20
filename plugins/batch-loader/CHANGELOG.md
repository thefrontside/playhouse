# @frontside/backstage-plugin-batch-loader

## 0.3.3

### Patch Changes

- 1c1b178: Upgraded to Backstage 1.12.1

## 0.3.2

### Patch Changes

- 05f3423: Upgraded to Backstage 1.11.1

## 0.3.1

### Patch Changes

- d803873: upgrade backstage dependencies

## 0.3.0

### Minor Changes

- f99de6d: Replacing batch-loader with getEntitiesByRefs from Backtage Catalog Client

  Backstage Catalog REST API is now providing an endpoint for querying entities by refs.
  This was in introduced in https://github.com/backstage/backstage/pull/14354 and
  it's available via the [Catalog API Client getEntitiesByRefs method](https://backstage.io/docs/reference/catalog-client.catalogapi.getentitiesbyrefs).

  This changes makes our `@frontside/backstage-plugin-batch-loader` unnecessary. In this release, we're deprecating
  `@frontside/backstage-plugin-batch-loader` and replacing it with native loader.

  You'll need to change your graphql plugin to pass the catalog client to the GraphQL plugin router.

## 0.2.4

### Patch Changes

- d62b0ad: Upgraded to Backstage 1.9

## 0.2.3

### Patch Changes

- f4cd38f: Make a lot improvements to the graphql-plugin:

  - `@relation` directive supports Relay Connections
  - `@extend` directive works only on interfaces
  - `@extend` allows to declare subtypes by defining condition by `when/is` arguments
  - For each interface with `@extend` directive a new object type is generated with `-Impl` suffix
  - Exposed `transformSchema` function for creating input schema for codegen
  - Allows to specify custom data loaders
  - Union types which are used in connections are transformed to interfaces

## 0.2.2

### Patch Changes

- 2a52c92: Upgraded dependencies to bring inline with Backstage 1.6

## 0.2.1

### Patch Changes

- 5618624: Lazy get database client for batch loader

## 0.2.0

### Minor Changes

- 37138ae: Remove init method from batch-loader plugin

## 0.1.1

### Patch Changes

- b26534b: Added batch-loader plugin
- 5f0c2bd: Sort entities by refs by using javascript
