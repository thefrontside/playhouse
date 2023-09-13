import { Module } from 'graphql-modules';
import {
  GraphQLContext,
  BatchLoadFn,
} from '@frontside/hydraphql';
import { Plugin } from 'graphql-yoga';
import { Options as DataLoaderOptions } from 'dataloader';
import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import {
  graphqlAppOptionsExtensionPoint,
  graphqlContextExtensionPoint,
  graphqlDataloaderOptionsExtensionPoint,
  graphqlModulesExtensionPoint,
  graphqlPluginsExtensionPoint,
  graphqlLoadersExtensionPoint,
  graphqlSchemasExtensionPoint,
} from '@frontside/backstage-plugin-graphql-backend-node';
import { createRouter } from './router';

/** @public */
export const graphqlPlugin = createBackendPlugin({
  pluginId: 'graphql',
  register(env) {
    const appOptions = {};
    env.registerExtensionPoint(graphqlAppOptionsExtensionPoint, {
      setAppOptions(newAppOptions) {
        Object.assign(appOptions, newAppOptions);
      },
    });

    const schemas = new Set<string>();
    env.registerExtensionPoint(graphqlSchemasExtensionPoint, {
      addSchemas(newSchemas) {
        for (const schema of newSchemas) schemas.add(schema);
      },
    });

    const modules = new Map<string, Module>();
    env.registerExtensionPoint(graphqlModulesExtensionPoint, {
      async addModules(newModules) {
        for (const module of newModules) {
          const resolvedModule = await (typeof module === 'function'
            ? module()
            : module);
          if (modules.has(resolvedModule.id)) {
            throw new Error(
              `A module with id "${resolvedModule.id}" has already been registered`,
            );
          }
          modules.set(resolvedModule.id, resolvedModule);
        }
      },
    });

    const plugins: Plugin[] = [];
    env.registerExtensionPoint(graphqlPluginsExtensionPoint, {
      addPlugins(newPlugins) {
        plugins.push(...newPlugins);
      },
    });

    const loaders = new Map<string, BatchLoadFn<any>>();
    env.registerExtensionPoint(graphqlLoadersExtensionPoint, {
      addLoaders(newLoaders) {
        for (const [name, loader] of Object.entries(newLoaders)) {
          if (loaders.has(name)) {
            throw new Error(
              `A loader with name "${name}" has already been registered`,
            );
          }
          loaders.set(name, loader);
        }
      },
    });

    const dataloaderOptions: DataLoaderOptions<string, any> = {};
    env.registerExtensionPoint(graphqlDataloaderOptionsExtensionPoint, {
      setDataloaderOptions(options) {
        Object.assign(dataloaderOptions, options);
      },
    });

    let context:
      | ((
          initialContext: GraphQLContext,
        ) => Record<string, any> | Promise<Record<string, any>>)
      | Promise<Record<string, any>>
      | Record<string, any>
      | undefined;
    env.registerExtensionPoint(graphqlContextExtensionPoint, {
      setContext(newContext) {
        const oldContext = context;
        context = async (init: Record<string, any> & GraphQLContext) => {
          const merged = {
            ...init,
            ...(await (oldContext instanceof Function
              ? oldContext(init)
              : oldContext)),
          };
          return {
            ...merged,
            ...(await (newContext instanceof Function
              ? newContext(merged)
              : newContext)),
          };
        };
      },
    });

    env.registerInit({
      deps: {
        logger: coreServices.logger,
        http: coreServices.httpRouter,
      },
      async init({ logger, http }) {
        http.use(await createRouter({
          logger,
          appOptions,
          schemas: [...schemas],
          modules: [...modules.values()],
          plugins,
          loaders,
          dataloaderOptions,
          context,
        }));
      },
    });
  },
});
