import type { Catalog } from './catalog';
import { GetEnvelopedFn, envelop, useExtendContext } from '@envelop/core';
import { useGraphQLModules } from '@envelop/graphql-modules';
import { Application, createApplication } from 'graphql-modules';
import { ResolverContext } from './resolver-context';
import { Relay } from './modules/relay';
import { Entities } from './modules/entities';

export interface App {
  (): ReturnType<GetEnvelopedFn<ResolverContext>>;
}

export const schema = create().schema;

export function createApp(catalog: Catalog): App {
  const application = create();

  const run = envelop({
    plugins: [
      useExtendContext(() => ({ catalog })),
      useGraphQLModules(application),
    ],
  });

  return run;
}

function create(): Application {
  return createApplication({
    modules: [Relay, Entities],
  });
}
