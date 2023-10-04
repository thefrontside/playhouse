# GraphQL Backend Catalog Module

A [GraphQL Module][graphql-module] providing access to the
[Backstage Software Catalog][catalog]

The plugin provides basic Catalog types, such as `Entity`, `User`,
`Component`, `System`, etc... and extends the [Directives
API][directives-api] with `@relation` directive.

You will almost always want to start by adding this plugin to your
[Graphql Backend][graphql-backend]

Some key features are currently missing. These features may change the schema in backward-incompatible ways.

1. `filter` query for filtering `nodes/entities`.
1. `viewer` query for retrieving data for the current user.

- [GraphQL modules](#graphql-modules)
  - [Backstage Plugins](#backstage-plugins)
  - [Experimental Backend System](#experimental-backend-system)
- [Directives API](#directives-api)
  - [`@relation` directive](#relation-directive)
- [Catalog Data loader](#catalog-data-loader-advanced)

## GraphQL modules

This package provides two GraphQL modules:
- `Catalog` module – provides basic Catalog GraphQL types and `@relation` directive
- `Relation` module – provides only `@relation` directive

### Backstage Plugins

For the [Backstage plugin system](https://backstage.io/docs/plugins/backend-plugin),
you can learn how to add GraphQL modules by checking out [GraphQL Modules](../graphql-backend/README.md#graphql-modules)
section in `@frontside/backstage-plugin-graphql-backend` package.

This package exports `Catalog` and `Relation` modules

### Experimental Backend System

For the [experimental backend system](https://backstage.io/docs/plugins/experimental-backend),
you can add them as a plugin modules:

- To use `Catalog` GraphQL module
```ts
// packages/backend/src/index.ts
import { graphqlModuleCatalog } from '@frontside/backstage-plugin-graphql-backend-module-catalog';

const backend = createBackend();
backend.use(graphqlModuleCatalog());
```

- To use `Relation` GraphQL module
```ts
import { graphqlModuleRelationResolver } from '@frontside/backstage-plugin-graphql-backend-module-catalog';

const backend = createBackend();
backend.use(graphqlModuleRelationResolver());
```

If you don't want to use basic Catalog types for some reason, but
still want to use `@relation` directive, you can install `Relation` module

## Directives API

### `@relation`

`@relation` directive allows you to resolve relationships between
entities. Similar to `@field` directive, it writes a resolver for you
so you do not have to write a resolver yourself. It assumes that
relationships are defined as standard `Entity` relationships. The
`name` argument allows you to specify the type of the relationship. It
will automatically look up the entity in the catalog.

1. To define a `User` that is the `owner` of a `Component`:

```graphql
type Component {
  owner: User @relation(name: "ownedBy")
}
```

2. The GraphQL server has baked in support for [Relay][relay]. By
   default, collections defined by a `@relation` directive are modeled as
   arrays. However, if the relationship is large, and should be
   paginated, you can specify it with `Connection` as the field type and
   use the `nodeType` argument to specify what the target of the
   collection should be.

```graphql
type Repository {
  contributors: Connection @relation(name: "contributedBy", nodeType: "User")

  # Or you can just use an array of entities
  contributors: [User] @relation(name: "contributedBy")
}
```

3. If you have different kinds of relationships with the same type you
   can filter them by `kind` argument:

```graphql
type System {
  components: Connection
    @relation(name: "hasPart", nodeType: "Component", kind: "component")
  resources: Connection
    @relation(name: "hasPart", nodeType: "Resource", kind: "resource")
}
```

## Catalog Data Loader (Advanced)

In most use cases, you will not need to create a Catalog `dataloader` by
hand. However, when writing [custom data loaders for accessing 3rd
party sources][custom-loader] or [rolling your own GraphQL Server
implementation][roll-your-own] you will need to provide the Catalog
loader yourself. This plugin provides the `createLoader` helper to do
just that.

[graphql-backend]: ../graphql-backend/README.md
[graphql-modules]: https://the-guild.dev/graphql/modules
[relay]: https://relay.dev/docs/guides/graphql-server-specification
[custom-loader]: ../graphql-backend/README.md#custom-data-loaders-advanced
[roll-your-own]: ../graphql-common/README.md#getting-started
[catalog]: https://backstage.io/docs/features/software-catalog/software-catalog-overview
[directives-api]: ../graphql-common/README.md#directives-api
