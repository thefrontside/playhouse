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
import { buildSchema, GraphQLSchema } from 'graphql';
import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';

import schemaSource from './schema.graphql'

export interface RouterOptions {
  logger: Logger;
}

let schema = buildSchema(schemaSource);
const resolvers = {
  // Query: {
  //   user(parent, args, context, info) {
  //     return users.find(user => user.id === args.id);
  //   }
  // }
};

function fieldDirectiveTransformer(s: GraphQLSchema, directiveName: string) {
  return mapSchema(s, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const fieldDirective = getDirective(s, fieldConfig, directiveName)?.[0];
      if (fieldDirective) {
        // TODO fieldDirective.at
        // const { resolve = defaultFieldResolver } = fieldConfig;
        // fieldConfig.resolve = async function newResolve(source, args, context, info) {
        //   const result = await resolve(source, args, context, info);
        //   if (typeof result === 'string') {
        //     return result.toUpperCase();
        //   }
        //   return result;
        // }
      }
      return fieldConfig;
    },
  });
};

schema = fieldDirectiveTransformer(schema, 'upper');

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger } = options;

  const router = Router();
  router.use(express.json());
  router.use((_, res, next) => {
    res.setHeader('Content-Security-Policy', "'self' http: 'unsafe-inline'");
    next()
  })
  router.use('/', graphqlHTTP({
    schema,
    rootValue: resolvers,
    graphiql: true,
  }));

  router.get('/health', (_, response) => {
    logger.info('PONG!');
    response.send({ status: 'ok' });
  });
  router.use(errorHandler());
  return router;
}
