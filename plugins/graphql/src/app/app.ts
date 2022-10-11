import type { CatalogApi } from './types';
import { envelop, useExtendContext } from '@envelop/core';
import { useGraphQLModules } from '@envelop/graphql-modules';
import { createApplication, Module } from 'graphql-modules';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { createLoader } from './loaders';
import { Catalog } from './modules/catalog/catalog';
import { Core } from './modules/core/core';
import { mappers } from './mappers';
import { mapSchema } from '@graphql-tools/utils';

export { transformSchema } from './transform';

export interface createGraphQLAppOptions {
  catalog: CatalogApi;
  modules: Module[]
}

export function createGraphQLApp(options: createGraphQLAppOptions) {
  const application = create(options);
  const loader = createLoader(options);

  const run = envelop({
    plugins: [
      useExtendContext(() => ({ catalog: options.catalog, loader })),
      useGraphQLModules(application),
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
        makeExecutableSchema({ typeDefs, resolvers}),
        mappers
      ),
    modules: [Core, Catalog, ...options.modules],
  });
}
