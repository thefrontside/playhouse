import { envelop } from '@envelop/core';
import { useGraphQLModules } from '@envelop/graphql-modules';
import { createApplication, Module } from 'graphql-modules';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { Catalog } from './modules/catalog/catalog';
import { Core } from './modules/core/core';
import { mappers } from './mappers';
import { mapSchema } from '@graphql-tools/utils';
import { EnvelopPlugins } from './types';
import { useDataLoader } from '@envelop/dataloader';
import DataLoader from 'dataloader';

export type createGraphQLAppOptions<Plugins extends EnvelopPlugins, Loader extends DataLoader<any, any>> = {
  loader: () => Loader
  plugins?: Plugins,
  modules?: Module[]
}

export function createGraphQLApp<
  Plugins extends EnvelopPlugins,
  Loader extends DataLoader<any, any>
>(options: createGraphQLAppOptions<Plugins, Loader>) {
  const { modules, plugins, loader } = options;
  const application = createApplication({
    schemaBuilder: ({ typeDefs, resolvers }) =>
      mapSchema(
        makeExecutableSchema({ typeDefs, resolvers }),
        mappers
      ),
    modules: [Core, Catalog, ...modules ?? []],
  });

  const run = envelop({
    plugins: [
      useGraphQLModules(application),
      useDataLoader('loader', loader),
      ...plugins ?? []
    ],
  });

  return { run, application };
}
