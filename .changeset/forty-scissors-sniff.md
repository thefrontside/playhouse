---
'@frontside/backstage-plugin-graphql': minor
'backend': patch
'@frontside/backstage-plugin-batch-loader': patch
---

Make a lot improvements to the graphql-plugin:

- `@relation` directive supports Relay Connections
- `@extend` directive works only on interfaces
- `@extend` allows to declare subtypes by defining condition by `when/is` arguments
- For each interface with `@extend` directive a new object type is generated with `-Impl` suffix
- Exposed `transformSchema` function for creating input schema for codegen
- Allows to specify custom data loaders
- Union types which are used in connections are transformed to interfaces
