/*
 * Copyright 2020 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
