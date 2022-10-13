import { errorHandler } from '@backstage/backend-common';
import express from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';
import { graphqlHTTP } from 'express-graphql';
import { BatchLoaderOptions } from '@frontside/backstage-plugin-batch-loader';
import { CatalogClient } from '@backstage/catalog-client';
import { printSchema } from 'graphql';
import type { Module } from 'graphql-modules';
import { createGraphQLApp, createGraphQLAppOptions } from './app';
import { Loader } from './types';
import { createLoader } from './loaders';

export * from './app';

export type RouterOptions = {
  logger: Logger;
  catalog: CatalogClient;
  modules?: Module[]
  plugins?: createGraphQLAppOptions['plugins']
} & ({ loader: Loader } | BatchLoaderOptions);

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger } = options;
  const loader = 'loader' in options ? options.loader : createLoader(options)

  const { run, application } = createGraphQLApp({
    catalog: options.catalog,
    modules: options.modules ?? [],
    plugins: options.plugins ?? [],
    loader,
  });

  const router = Router();
  router.use(express.json());
  router.use((_, res, next) => {
    res.setHeader('Content-Security-Policy', "'self' http: 'unsafe-inline'");
    next();
  });

  router.get('/schema', (_, response) => {
    response.send(printSchema(application.schema))
  });

  router.use('/', graphqlHTTP(async () => {
    const { parse, validate, contextFactory, execute } = run();
    return {
      schema: application.schema,
      graphiql: true,
      customParseFn: parse,
      customValidateFn: validate,
      customExecuteFn: async args => {
        return execute({
          ...args,
          contextValue: await contextFactory(),
        });
      },
    };
  }));

  router.get('/health', (_, response) => {
    logger.info('PONG!');
    response.send({ status: 'ok' });
  });
  router.use(errorHandler());
  return router;
}
