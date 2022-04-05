import type { Catalog } from './catalog';
import { GetEnvelopedFn, useSchema, envelop, useExtendContext } from '@envelop/core';
import { Application, createApplication } from 'graphql-modules';
import { ResolverContext } from './resolver-context';

export interface App {
  (): ReturnType<GetEnvelopedFn<ResolverContext>>;
}

export const schema = create().schema;

export function createApp(catalog: Catalog): App {
  const application = create();
  const schema = application.createSchemaForApollo();

  const run = envelop({
    plugins: [
      useExtendContext(() => ({ catalog })),
      useSchema(schema),
    ],
  });

  return run;
}

function create(): Application {
  return createApplication({
    modules: [],
  });
}
