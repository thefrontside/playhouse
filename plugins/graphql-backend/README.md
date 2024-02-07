# GraphQL Backend

The `graphql-backend` plugin adds a [GraphQL][] endpoint
(`/api/graphql`) to your Backstage instances, and provides a mechanism
to customize it without having to write any bespoke TypeScript.

It uses [GraphQL Modules][graphql-modules] and [Envelop][] plugins so you can
compose pieces of schema and middleware from many different places
(including other plugins) into a single, complete GraphQL server.

At a minimum, you should install the [graphql-backend-module-catalog][] which adds basic
schema elements to access the [Backstage Catalog][backstage-catalog] via GraphQL

- [Backstage Plugins](./docs/backend-plugins.md#getting-started)
- [Backend System](#backend-system)
  - [Getting started](#getting-started)
  - [GraphQL Modules](#graphql-modules)
    - [Custom GraphQL Module](#custom-graphql-module)
  - [Envelop Plugins](#envelop-plugins)
  - [GraphQL Context](#graphql-context)
  - [Custom Data loaders](#custom-data-loaders-advanced)
- [Extending Schema](https://github.com/thefrontside/HydraphQL/blob/main/README.md#extending-your-schema-with-a-custom-module)
- [Integrations](#integrations)
  - [Backstage GraphiQL Plugin](#backstage-graphiql-plugin)
  - [Backstage API Docs](#backstage-api-docs)
- [Questions](#questions)

## Backend System

This approach is suitable for the new [Backstage backend system](https://backstage.io/docs/backend-system/).
For the current [Backstage plugins system](https://backstage.io/docs/plugins/backend-plugin) see [Backstage Plugins](./docs/backend-plugins.md#getting-started)

### Getting Started

To install the GraphQL Backend onto your server:

1. Add GraphQL plugin and Application backend module in `packages/backend/src/index.ts`:

```ts
import { graphqlPlugin } from '@frontside/backstage-plugin-graphql-backend';

const backend = createBackend();

// GraphQL
backend.use(graphqlPlugin());
```

2. Start the backend

```bash
yarn workspace example-backend start
```

This will launch the full example backend. However, without any modules
installed, you won't be able to do much with it.

### GraphQL Modules

The way to add new types and new resolvers to your GraphQL backend is
with [GraphQL Modules][graphql-modules]. These are portable little
bundles of schema that you can drop into place and have them extend
your GraphQL server. The most important of these that is maintained by
the Backstage team is the [graphql-backend-module-catalog][] module that makes your
Catalog accessible via GraphQL. Add this module to your backend:

```ts
// packages/backend/src/index.ts
import { graphqlModuleCatalog } from '@frontside/backstage-plugin-graphql-backend-module-catalog';

const backend = createBackend();

// GraphQL
backend.use(graphqlPlugin());
backend.use(graphqlModuleCatalog());
```

#### Custom GraphQL Module

To learn more about adding your own modules, see the [HydraphQL][] package.

To extend your schema, you will define it using the GraphQL Schema Definition
Language, and then (optionally) write resolvers to handle the various types
which you defined.

1. Create modules directory where you'll store all your GraphQL modules, for example in `packages/backend/src/modules`
1. Create a module directory `my-module` there
1. Create a GraphQL schema file `my-module.graphql` in the module directory

```graphql
extend type Query {
  hello: String!
}
```

This code adds a `hello` field to the global `Query` type. Next, we are going to
write a module containing this schema and its resolvers.

4. Create a GraphQL module file `my-module.ts` in the module directory

```ts
import { resolvePackagePath } from "@backstage/backend-common";
import { loadFilesSync } from "@graphql-tools/load-files";
import { createModule } from "graphql-modules";

export const myModule = createModule({
  id: "my-module",
  dirname: resolvePackagePath("backend", "src/modules/my-module"),
  typeDefs: loadFilesSync(
    resolvePackagePath("backend", "src/modules/my-module/my-module.graphql"),
  ),
  resolvers: {
    Query: {
      hello: () => "world",
    },
  },
});
```

5. Now we can pass your GraphQL module to GraphQL Application backend
   module

```ts
// packages/backend/src/modules/graphqlMyModule.ts
import { createBackendModule } from "@backstage/backend-plugin-api";
import { graphqlModulesExtensionPoint } from "@frontside/backstage-plugin-graphql-backend-node";
import { MyModule } from "../modules/my-module/my-module";

export const graphqlModuleMyModule = createBackendModule({
  pluginId: "graphql",
  moduleId: "myModule",
  register(env) {
    env.registerInit({
      deps: { modules: graphqlModulesExtensionPoint },
      async init({ modules }) {
        await modules.addModules([MyModule]);
      },
    });
  },
});
```

6. And then add it to your backend

```ts
// packages/backend/src/index.ts
import { graphqlModuleMyModule } from "./modules/graphqlMyModule";

const backend = createBackend();

// GraphQL
backend.use(graphqlPlugin());
backend.use(graphqlModuleMyModule());
```

### Envelop Plugins

Whereas [Graphql Modules][graphql-modules] are used to extend the
schema and resolvers of your GraphQL server, [Envelop][] plugins are
used to extend its GraphQL stack with tracing, error handling, context
extensions, and other middlewares.

Plugins are be added via declaring GraphQL Yoga backend module.
For example, to prevent potentially sensitive error messages from
leaking to your client in production, add the [`useMaskedErrors`][usemaskederrors]
package.

```ts
// packages/backend/src/modules/graphqlPlugins.ts
import { createBackendModule } from '@backstage/backend-plugin-api';
import { graphqlPluginsExtensionPoint } from '@frontside/backstage-plugin-graphql-backend-node';
import { useMaskedErrors } from '@envelop/core';

export const graphqlModulePlugins = createBackendModule({
  pluginId: 'graphql',
  moduleId: 'plugins',
  register(env) {
    env.registerInit({
      deps: { plugins: graphqlPluginsExtensionPoint },
      async init({ plugins }) {
        plugins.addPlugins([useMaskedErrors()]);
      },
    });
  },
});
```

Then add module to your backend:

```ts
// packages/backend/src/index.ts
import { graphqlModulePlugins } from './modules/graphqlPlugins';

const backend = createBackend();

// GraphQL
backend.use(graphqlPlugin());
backend.use(graphqlModulePlugins());
```

### GraphQL Context

The GraphQL context is an object that is passed to every resolver
function. It is a convenient place to store data that is needed by
multiple resolvers, such as a database connection or a logger.

You can add additional data to the context to GraphQL Yoga backend module:

```ts
// packages/backend/src/modules/graphqlContext.ts
import { createBackendModule } from '@backstage/backend-plugin-api';
import { graphqlContextExtensionPoint } from '@frontside/backstage-plugin-graphql-backend-node';

export const graphqlModuleContext = createBackendModule({
  pluginId: 'graphql',
  moduleId: 'context',
  register(env) {
    env.registerInit({
      deps: { context: graphqlContextExtensionPoint },
      async init({ context }) {
        context.setContext({ myContext: 'Hello World' });
      },
    });
  },
});
```

### Custom Data Loaders (Advanced)

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
// packages/backend/src/modules/graphqlLoaders.ts
import { createBackendModule } from '@backstage/backend-plugin-api';
import { graphqlLoadersExtensionPoint } from '@frontside/backstage-plugin-graphql-backend-node';
import { NodeQuery } from '@frontside/hydraphql';

export const graphqlModuleLoaders = createBackendModule({
  pluginId: 'graphql',
  moduleId: 'loaders',
  register(env) {
    env.registerInit({
      deps: { loaders: graphqlLoadersExtensionPoint },
      async init({ loaders }) {
        loaders.addLoaders({
          ProjectAPI: async (
            queries: readonly NodeQuery[],
            context: GraphQLContext,
          ) => {
            /* Fetch */
          },
          TaskAPI: async (queries: readonly NodeQuery[], context: GraphQLContext) => {
            /* Fetch */
          },
        });
      },
    });
  },
});
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

## Integrations

### Backstage GraphiQL Plugin

It's convenient to be able to query the Backstage GraphQL API from inside of Backstage App. You can accomplish this by installing the [Backstage GraphiQL Plugin](https://roadie.io/backstage/plugins/graphiQL/) and adding the GraphQL API endpoint to the GraphiQL Plugin API factory.

1. Once you installed `@backstage/plugin-graphiql` plugin [with these instructions](https://roadie.io/backstage/plugins/graphiQL/)
2. Modify `packages/app/src/apis.ts` to add your GraphQL API as an endpoint

```ts
factory: ({ errorApi, githubAuthApi, discovery }) =>
  GraphQLEndpoints.from([
    {
      id: 'backstage-backend',
      title: 'Backstage GraphQL API',
      // we use the lower level object with a fetcher function
      // as we need to `await` the backend url for the graphql plugin
      fetcher: async (params: any) => {
        const graphqlURL = await discovery.getBaseUrl('graphql');
        return fetch(graphqlURL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        }).then(res => res.json());
      },
    },
  ]);
```

Checkout this example [`packages/app/src/apis.ts`](../../packages/app/src/apis.ts).

### Backstage API Docs

You might want to show the schema from your GraphQL API in the API definition section of an API entity in Backstage. You can use the `/api/graphql/schema` endpoint to read the schema provided by your GraphQL API. Here's how:

1. Create the API entity and reference `definition.$text: http://localhost:7007/api/graphql/schema`

   ```yaml
   apiVersion: backstage.io/v1alpha1
   kind: API
   metadata:
     name: backstage-graphql-api
     description: GraphQL API provided by GraphQL Plugin
   spec:
     type: graphql
     owner: engineering@backstage.io
     lifecycle: production
     definition:
       $text: http://localhost:7007/api/graphql/schema
   ```

2. Modify `app-config.yaml` to allow reading urls from `localhost:7007`

```yaml
backend:
  ...
  reading:
    allow:
      - host: localhost:7007
```

## Questions

### Why was my `union` type transformed to an interface in output schema?

You might notice that if you have a `union` type which is used in
`@relation` directive with `Connection` type, like this:

```graphql
union Owner = User | Group

type Resource @implements(interface: "Entity") {
  owners: Connection! @relation(name: "ownedBy", nodeType: "Owner")
}
```

In output schema you'll get:

```graphql
interface Owner implements Node {
  id: ID!
}

type OwnerConnection implements Connection {
  pageInfo: PageInfo!
  edges: [OwnerEdge!]!
  count: Int
}

type OwnerEdge implements Edge {
  cursor: String!
  node: Owner!
}

type User implements Entity & Node & Owner {
  # ...
}

type Group implements Entity & Node & Owner {
  # ...
}
```

The reason why we do that, is because `Edge` interface has a `node`
field with `Node` type. So it forces that any object types that
implement `Edge` interface must have the `node` field with the type
that implements `Node` interface. And unions can't implement
interfaces yet
([graphql/graphql-spec#518](https://github.com/graphql/graphql-spec/issues/518))
So you just simply can't use unions in such case. As a workaround we
change a union to an interface that implements `Node` and each type
that was used in the union, now implements the new interface. To an
end user there is no difference between a union and interface
approach, both variants work similar.

[graphql]: https://graphql.org
[envelop]: https://the-guild.dev/graphql/envelop
[graphql-modules]: https://the-guild.dev/graphql/modules
[graphql-backend-module-catalog]: ../graphql-backend-module-catalog/README.md
[HydraphQL]: https://github.com/thefrontside/HydraphQL/blob/main/README.md
[backstage-catalog]: https://backstage.io/docs/features/software-catalog/software-catalog-overview
[usemaskederrors]: https://the-guild.dev/graphql/envelop/plugins/use-masked-errors
