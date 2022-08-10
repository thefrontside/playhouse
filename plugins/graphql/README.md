# @frontside/backstage-plugin-graphql

> **Status: Alpha** - this plugin is in early stage of code maturity. It includes features that were battle tested on client's projects, but require some time in open source to settle. You should expect the schema provided by this plugin to change because we're missing a number of important features.

Backstage GraphQL Plugin adds a GraphQL API to a Backstage developer portal. The GraphQL API behaves like a gateway to provide a single API for accessing data from the Catalog and other plugins. Currently, it only supports the Backstage catalog.

It includes the following features,

1. **Graph schema** - easily query relationships between data in the catalog.
2. **Schema-based resolvers** - add field resolvers using directives without requiring JavaScript.
3. **Modular schema definition** - allows organizing related schema into [graphql-modules](https://www.graphql-modules.com/docs)
4. Strives to support - [GraphQL Server Specification]

Some key features are currently missing. These features may change the schema in backward-incompatible ways.

1. [`Connection`](https://relay.dev/docs/guides/graphql-server-specification/#connections) based on [GraphQL Cursor Connections Specification](https://relay.dev/graphql/connections.htm).(see [#68](https://github.com/thefrontside/backstage/issues/68))
2. `viewer` query for retrieving data for the current user. (see [#67](https://github.com/thefrontside/backstage/issues/67))

We plan to add these over time. If you're interested in contributing to this plugin, feel free to message us in [`#graphql` channel in Backstage Discord](https://discord.gg/yXEYX2h7Ed).

## Getting started

You can install the GraphQL Plugin using the same process that you would use to install other backend Backtstage plugins.

1. Run `yarn add @frontside/backstage-plugin-graphql` in `packages/backend`
2. Create `packages/backend/src/plugins/graphql.ts` file with the following content

    ```ts
    import { createRouter } from '@frontside/backstage-plugin-graphql';
    import { Router } from 'express';
    import { PluginEnvironment } from '../types';

    export default async function createPlugin(
      env: PluginEnvironment,
    ): Promise<Router> {
      return await createRouter({
        logger: env.logger,
        catalog: env.catalog,
      });
    }
    ```

3. Add plugin's router to your backend API router in `packages/backend/src/index.ts`

    ```ts
    // import the graphql plugin
    import graphql from './plugins/graphql';

    // create the graphql plugin environment
    const graphqlEnv = useHotMemoize(module, () => createEnv('graphql'));

    // add `/graphql` route to your apiRouter
    apiRouter.use('/graphql', await graphql(graphqlEnv));
    ```

  See [packages/backend/src/index.ts](https://github.com/thefrontside/backstage/blob/main/packages/backend/src/index.ts) for an example.

