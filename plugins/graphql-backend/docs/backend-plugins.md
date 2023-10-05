# GraphQL Backend

- [Getting started](#getting-started)
- [GraphQL Modules](#graphql-modules)
- [Envelop Plugins](#envelop-plugins)
- [GraphQL Context](#graphql-context)
- [Custom Data loaders](#custom-data-loaders-advanced)

## Getting Started

If you are using the [Backstage plugin system](https://backstage.io/docs/plugins/backend-plugin),
then you can install the GraphQL Backend as a plugin

1. Create a GraphQL plugin in your backend:

```ts
// packages/backend/src/plugins/graphql.ts
import { createRouter } from '@frontside/backstage-plugin-graphql-backend';
import { Router } from 'express';
import { PluginEnvironment } from '../types';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  return await createRouter({
    logger: env.logger,
  });
}
```

2. Add a route for the GraphQL plugin:

```ts
// packages/backend/src/index.ts
import graphql from './plugins/graphql';

// ...
async function main() {
  // ...
  const graphqlEnv = useHotMemoize(module, () => createEnv('graphql'));
  apiRouter.use('/graphql', await graphql(graphqlEnv));
}
```

3. Start the backend

```bash
yarn workspace example-backend start
```

This will launch the full example backend. However, without any modules
installed, you won't be able to do much with it.

## GraphQL Modules

The way to add new types and new resolvers to your GraphQL backend is
with [GraphQL Modules][graphql-modules]. These are portable little
bundles of schema that you can drop into place and have them extend
your GraphQL server. The most important of these that is maintained by
the Backstage team is the [graphql-backend-module-catalog][] module that makes your
Catalog accessible via GraphQL. To add this module to your GraphQL server,
add it to the `modules` array in your backend config:

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
  });
}
```

To learn more about adding your own modules, see the [hydraphql][] package.

## Envelop Plugins

Whereas [Graphql Modules][graphql-modules] are used to extend the
schema and resolvers of your GraphQL server, [Envelop][] plugins are
used to extend its GraphQL stack with tracing, error handling, context
extensions, and other middlewares.

Plugins are be added via declaring GraphQL Yoga backend module.
For example, to prevent potentially sensitive error messages from
leaking to your client in production, add the [`useMaskedErrors`][usemaskederrors]
plugin.

```ts
import { createRouter } from '@frontside/backstage-plugin-graphql-backend';
import { useMaskedErrors } from '@envelop/core';

// packages/backend/src/plugins/graphql.ts
export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  return await createRouter({
    logger: env.logger,
    plugins: [useMaskedErrors()],
  });
}
```

## GraphQL Context

The GraphQL context is an object that is passed to every resolver
function. It is a convenient place to store data that is needed by
multiple resolvers, such as a database connection or a logger.

You can add additional data to the context to GraphQL Yoga backend module:

```ts
import { createRouter } from '@frontside/backstage-plugin-graphql-backend';

// packages/backend/src/plugins/graphql.ts
export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  return await createRouter({
    logger: env.logger,
    context: { myContext: 'Hello World' },
  });
}
```

## Custom Data Loaders (Advanced)

By default, your graphql context will contain a `Dataloader` for retrieving
records from the Catalog by their GraphQL ID. Most of the time this is all you
will need. However, sometimes you will need to load data not just from the
Backstage catalog, but from a different data source entirely. To do this, you
will need to pass batch load functions for each data source.

> ⚠️Caution! If you find yourself wanting to load data directly from a
> source other than the catalog, first consider the idea of instead
> just ingesting that data into the catalog, and then using the
> default data loader. After consideration, If you still want to load
> data directly from a source other than the Backstage catalog, then
> proceed with care.

Load functions are to GraphQL Yoga backend module. Each load function
is stored under a unique key which is encoded inside node's id as a data
source name

```ts
import { createRouter } from '@frontside/backstage-plugin-graphql-backend';
import { NodeQuery } from '@frontside/hydraphql';

// packages/backend/src/plugins/graphql.ts
export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  return await createRouter({
    logger: env.logger,
    loaders: {
      ProjectAPI: async (
        queries: readonly NodeQuery[],
        context: GraphQLContext,
      ) => {
        /* Fetch */
      },
      TaskAPI: async (queries: readonly NodeQuery[], context: GraphQLContext) => {
        /* Fetch */
      },
    },
  });
}
```

Then you can use `@resolve` directive in your GraphQL schemas

```graphql
interface Node
  @discriminates(with: "__source")
  @discriminationAlias(value: "Project", type: "ProjectAPI")
  @discriminationAlias(value: "Task", type: "TaskAPI")

type Project @implements(interface "Node") {
  tasks: [Task] @resolve(at: "spec.projectId", from: "TaskAPI")
}

type Task @implements(interface "Node") {
  # ...
}
```

[graphql]: https://graphql.org
[envelop]: https://the-guild.dev/graphql/envelop
[graphql-modules]: https://the-guild.dev/graphql/modules
[graphql-catalog]: ../graphql-backend-module-catalog/README.md
[hydraphql]: https://github.com/thefrontside/HydraphQL/blob/main/README.md
[backstage-catalog]: https://backstage.io/docs/features/software-catalog/software-catalog-overview
[usemaskederrors]: https://the-guild.dev/graphql/envelop/plugins/use-masked-errors
