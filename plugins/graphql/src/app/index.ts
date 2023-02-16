import { errorHandler, SingleHostDiscovery } from '@backstage/backend-common';
import express from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';
import { Module } from 'graphql-modules';
import { createLoader as createCatalogLoader } from './loaders';
import helmet from 'helmet';
import DataLoader from 'dataloader';
import { CatalogClient } from '@backstage/catalog-client';
import { createYoga, Plugin, YogaServerInstance } from 'graphql-yoga';
import { useGraphQLModules } from '@envelop/graphql-modules';
import { useDataLoader } from '@envelop/dataloader';
import { CompoundEntityRef } from '@backstage/catalog-model';
import { Config } from '@backstage/config';
import { printSchema } from 'graphql';
import { ResolverContext } from './types';
import { createGraphQLApp } from './app';

export interface RouterOptions {
  config: Config;
  logger: Logger;
  modules?: Module[];
  plugins?: Plugin[];
  createLoader?: (
    context: Omit<ResolverContext, 'loader'>,
  ) => DataLoader<string, any>;
  refToId?: (ref: CompoundEntityRef | string) => string;
}

export async function createRouter({
  config,
  logger,
  modules,
  plugins,
  createLoader,
  refToId,
}: RouterOptions): Promise<express.Router> {
  let yoga: YogaServerInstance<any, any> | null = null;

  const router = Router();
  const discovery = SingleHostDiscovery.fromConfig(config);
  const catalog = new CatalogClient({ discoveryApi: discovery });
  const application = createGraphQLApp({ modules, logger });

  router.get('/health', (_, response) => {
    response.json({ status: 'ok' });
  });

  router.get('/schema', (_, response) => {
    response.send(printSchema(application.schema));
  });

  if (process.env.NODE_ENV === 'development')
    router.use(
      helmet.contentSecurityPolicy({
        directives: {
          defaultSrc: ["'self'", "'unsafe-inline'", 'http://*'],
          scriptSrc: ["'self'", "'unsafe-inline'", 'https://*'],
          imgSrc: ["'self'", 'https: data:'],
        },
      }),
    );

  router.use((req, res, next) => {
    if (!yoga) {
      yoga = createYoga({
        plugins: [
          useGraphQLModules(application),
          useDataLoader('loader', createLoader ?? createCatalogLoader),
          ...(plugins ?? []),
        ],
        context: { application, catalog, refToId },
        logging: logger,
        graphqlEndpoint: req.baseUrl,
      });
    }
    return yoga(req, res, next);
  });
  router.use(errorHandler());

  return router;
}
