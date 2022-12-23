# @frontside/backstage-plugin-batch-loader

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
