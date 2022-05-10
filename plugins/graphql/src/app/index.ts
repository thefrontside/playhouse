import { errorHandler } from '@backstage/backend-common';
import express from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';
import { graphqlHTTP } from 'express-graphql';
import { CatalogClient } from '@backstage/catalog-client';

export interface RouterOptions {
  logger: Logger;
  catalog: CatalogClient;
}

import { schema, createApp } from './app';

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger } = options;

  const app = createApp(options.catalog);

  const router = Router();
  router.use(express.json());
  router.use((_, res, next) => {
    res.setHeader('Content-Security-Policy', "'self' http: 'unsafe-inline'");
    next();
  });

  router.use('/',  graphqlHTTP(async () => {
    const { parse, validate, contextFactory, execute } = app();
    return {
      schema,
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
