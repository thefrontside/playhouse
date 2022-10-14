import { envelop } from '@envelop/core';
import { useGraphQLModules } from '@envelop/graphql-modules';
import { useDataLoader } from '@envelop/dataloader';
import { Application, createApplication, Module } from 'graphql-modules';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { Catalog } from './modules/catalog/catalog';
import { Core } from './modules/core/core';
import { mappers } from './mappers';
import { mapSchema } from '@graphql-tools/utils';
import DataLoader from 'dataloader';
import { Context, EnvelopPlugins } from './types';

export type createGraphQLAppOptions<Plugins extends EnvelopPlugins, Loader extends DataLoader<any, any>> = {
  loader: (context: Context<Plugins>) => Loader
  modules: Module[]
  plugins: Plugins | ((app: Application) => Plugins)
}

export function createGraphQLApp<
  Plugins extends EnvelopPlugins,
  Loader extends DataLoader<any, any>
>(options: createGraphQLAppOptions<Plugins, Loader>) {
  const { loader, modules, plugins } = options;
  const application = create(modules);

  const run = envelop({
    plugins: [
      useDataLoader('loader', loader),
      useGraphQLModules(application),
      ...Array.isArray(plugins) ? plugins : plugins(application)
    ],
  });

  return { run, application };
}

function create(modules: Module[]) {
  return createApplication({
    schemaBuilder: ({ typeDefs, resolvers }) =>
      mapSchema(
        makeExecutableSchema({ typeDefs, resolvers }),
        mappers
      ),
    modules: [Core, Catalog, ...modules],
  });
}
