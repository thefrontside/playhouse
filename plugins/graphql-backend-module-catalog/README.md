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
  - [Backend System](#backend-system)
- [Directives API](#directives-api)
  - [`@relation` directive](#relation-directive)
- [Custom GraphQL Resolvers](#custom-graphql-resolvers)

## GraphQL modules

This package provides two GraphQL modules:
- `Catalog` module – provides basic Catalog GraphQL types and `@relation` directive
- `Relation` module – provides only `@relation` directive

### Backstage Plugins

For the [Backstage plugin system](https://backstage.io/docs/plugins/backend-plugin),
you have to pass `Catalog` or `Relation` GraphQL module to the `modules` option and
create catalog `DataLoader`:

```ts
import { createRouter } from '@frontside/backstage-plugin-graphql-backend';
import { Catalog } from '@frontside/backstage-plugin-graphql-backend-module-catalog';

// packages/backend/src/plugins/graphql.ts
export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  return await createRouter({
    logger: env.logger,
    modules: [Catalog],
    loaders: { ...createCatalogLoader(env.catalogClient) },
    // You might want to pass catalog client to the context
    // and use it in resolvers, but it's not required
    context: ctx => ({ ...ctx, catalog: env.catalogClient }),
  });
}
```

### Backend System

For the [backend system](https://backstage.io/docs/backend-system/),
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

## Custom GraphQL Resolvers

If you need to implement complicated logic for some fields and can't be
achieved with available [directives][directives-api], you can write
your own resolvers. To do this, you need to define a resolver function
in your [GraphQL module](../graphql-backend/README.md#custom-graphql-module):

```ts
import { createModule } from "graphql-modules";
import type { CatalogClient, QueryEntitiesRequest } from '@backstage/catalog-client';
import { encodeEntityId } from '@frontside/backstage-plugin-graphql-backend-module-catalog';

export const myModule = createModule({
  /* ... */
  resolvers: {
    Task: {
      // This resolver utilize 3rd party api to get entity ref and then encodes it to NodeId
      // Which will be resolved to an entity
      entity: async (_, args, { taskAPI }) => {
        const response = await taskAPI.getTask(args.taskId);
        return { id: encodeEntityId(response.entityRef) };
      },
    },
    Query: {
      // Here you can use catalog client to query entities
      entities: async (
        _: any,
        args: QueryEntitiesRequest,
        // If you aren't using Backstage Backend System https://backstage.io/docs/backend-system/
        // This requires you to pass catalog client to the context
        { catalog }: { catalog: CatalogClient }
      ): Promise<{ id: string }[]> => {
        const { items: entities } = await catalog.queryEntities(args);
        return entities.map(entity => ({ id: encodeEntityId(entity) }));
      },
    },
  },
});
```

[graphql-backend]: ../graphql-backend/README.md
[graphql-modules]: https://the-guild.dev/graphql/modules
[relay]: https://relay.dev/docs/guides/graphql-server-specification
[custom-loader]: ../graphql-backend/README.md#custom-data-loaders-advanced
[catalog]: https://backstage.io/docs/features/software-catalog/software-catalog-overview
[directives-api]: https://github.com/thefrontside/HydraphQL/blob/main/README.md#directives-api
