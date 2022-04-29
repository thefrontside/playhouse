import type { Catalog } from './catalog';
import { GetEnvelopedFn, envelop, useExtendContext } from '@envelop/core';
import { useGraphQLModules } from '@envelop/graphql-modules';
import { Application, createApplication } from 'graphql-modules';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { ResolverContext } from './resolver-context';
import { Node } from './modules/node/node';
import { Entity } from './modules/entity/entity';
import { Component } from './modules/component/component';
import { System } from './modules/system/system';
import { User } from './modules/user/user';
import { Resource } from './modules/resource/resource';
import { Domain } from './modules/domain/domain';
import { createLoader } from './loaders';
import { Shared } from './modules/shared/shared';
import { API } from './modules/api/api';
import { Location } from './modules/location/location';
import { Template } from './modules/template/template';
import { transform } from './schema-mapper';
import { MyModule } from "./modules/my-module/my-module";

export interface App {
  (): ReturnType<GetEnvelopedFn<ResolverContext>>;
}

export const schema = create().schema;

export function createApp(catalog: Catalog): App {
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
    modules: [
      Shared,
      Node,
      Entity,
      Component,
      System,
      User,
      Resource,
      Domain,
      API,
      Location,
      Template,
      MyModule,
    ],
  });
}
