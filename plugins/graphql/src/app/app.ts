import { CatalogApi } from '@backstage/catalog-client';
import { GetEnvelopedFn, envelop, useExtendContext } from '@envelop/core';
import { useGraphQLModules } from '@envelop/graphql-modules';
import { Application, createApplication } from 'graphql-modules';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { ResolverContext } from './resolver';
import { createLoader } from './loaders';
import { Catalog } from './modules/catalog/catalog';
import { Core } from './modules/core/core';
import { transform } from './schema-mapper';

export interface App {
  (): ReturnType<GetEnvelopedFn<ResolverContext>>;
}

export const schema = create().schema;

export function createApp(catalog: CatalogApi): App {
  const application = create();
  const loader = createLoader({ catalog });

  const run = envelop({
    plugins: [
      useExtendContext(() => ({ catalog, loader })),
      useGraphQLModules(application),
    ],
  });

  return run;
}

function create(): Application {
  return createApplication({
    schemaBuilder: ({ typeDefs, resolvers }) =>
      transform(makeExecutableSchema({ typeDefs, resolvers })),
    modules: [Core, Catalog],
  });
}
