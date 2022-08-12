import type { EntityLoader } from './types';
import { envelop } from '@envelop/core';
import { useGraphQLModules } from '@envelop/graphql-modules';
import { useDataLoader } from '@envelop/dataloader';
import { createApplication, Module } from 'graphql-modules';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { Catalog } from './modules/catalog/catalog';
import { Core } from './modules/core/core';
import { transform } from './schema-mapper';

export interface createGraphQLAppOptions {
  entityLoaderCreator: () => EntityLoader
  modules: Module[]
}

export function createGraphQLApp({ modules, entityLoaderCreator }: createGraphQLAppOptions) {
  const application = createApplication({
    schemaBuilder: ({ typeDefs, resolvers }) =>
      transform(makeExecutableSchema({
        typeDefs, resolvers
      })),
    modules: [Core, Catalog, ...modules],
  });

  const run = envelop({
    plugins: [
      useDataLoader("entityLoader", entityLoaderCreator),
      useGraphQLModules(application),
    ],
  });

  return { run, application };
}