import type { Catalog } from './catalog';
import { GetEnvelopedFn, envelop, useExtendContext } from '@envelop/core';
import { useGraphQLModules } from '@envelop/graphql-modules';
import { Application, createApplication } from 'graphql-modules';
import { ResolverContext } from './resolver-context';
import { Node } from './modules/node';
import { Entity } from './modules/entity';
import { Component } from './modules/component';
import { System } from './modules/system';
import { User } from './modules/user';
import { Resource } from './modules/resource';
import { Domain } from './modules/domain';
import { createLoader } from './loaders';
import { createApplicationMapper } from './mappers';

export interface App {
  (): ReturnType<GetEnvelopedFn<ResolverContext>>;
}

export const schema = create().schema;

export function createApp(catalog: Catalog): App {
  const application = create();
  const mapper = createApplicationMapper(application);
  const loader = createLoader({ catalog, mapper })

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
    modules: [Node, Entity, Component, System, User, Resource, Domain],
  });
}
