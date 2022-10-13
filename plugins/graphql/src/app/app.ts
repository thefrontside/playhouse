import type { CatalogApi, Loader } from './types';
import { envelop, useExtendContext } from '@envelop/core';
import { useGraphQLModules } from '@envelop/graphql-modules';
import { useDataLoader } from '@envelop/dataloader';
import { createApplication, Module } from 'graphql-modules';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { Catalog } from './modules/catalog/catalog';
import { Core } from './modules/core/core';
import { mappers } from './mappers';
import { mapSchema } from '@graphql-tools/utils';

export { transformSchema } from './transform';

export type createGraphQLAppOptions = {
  catalog: CatalogApi;
  modules: Module[]
  plugins: Parameters<typeof envelop>[0]['plugins']
  loader: () => Loader
}

export function createGraphQLApp(options: createGraphQLAppOptions) {
  const application = create(options);

  const run = envelop({
    plugins: [
      useExtendContext(() => ({ catalog: options.catalog })),
      useDataLoader('loader', options.loader),
      useGraphQLModules(application),
      ...options.plugins
    ],
  });

  return { run, application };
}

interface CreateOptions {
  modules: Module[]
}

function create(options: CreateOptions) {
  return createApplication({
    schemaBuilder: ({ typeDefs, resolvers }) =>
      mapSchema(
        makeExecutableSchema({ typeDefs, resolvers }),
        mappers
      ),
    modules: [Core, Catalog, ...options.modules],
  });
}
