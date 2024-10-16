import { errorHandler } from '@backstage/backend-common';
import express from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';
import { Module } from 'graphql-modules';
import helmet from 'helmet';
import { Options } from 'dataloader';
import { createYoga, Plugin, YogaServerInstance } from 'graphql-yoga';
import { useGraphQLModules } from '@envelop/graphql-modules';
import { useDataLoader } from '@envelop/dataloader';
import { printSchema } from 'graphql';
import { GraphQLAppOptions } from '@frontside/backstage-plugin-graphql-backend-node';
import { useCSRFPrevention } from '@graphql-yoga/plugin-csrf-prevention';
import {
  createLoader,
  createGraphQLApp,
  GraphQLContext,
  BatchLoadFn,
  GraphQLModule,
} from '@frontside/hydraphql';
import { LoggerService } from '@backstage/backend-plugin-api';

export interface RouterOptions {
  appOptions?: GraphQLAppOptions;
  schemas?: string[];
  modules?: (Module| GraphQLModule)[];
  plugins?: Plugin[];
  loaders?: Record<string, BatchLoadFn<GraphQLContext>>;
  dataloaderOptions?: Options<string, any>;
  context?: ((
    initialContext: GraphQLContext,
  ) => Record<string, any> | Promise<Record<string, any>>)
| Promise<Record<string, any>>
| Record<string, any>
| undefined;
  logger: Logger | LoggerService;
}

export async function createRouter({
  appOptions = {},
  schemas = [],
  modules = [],
  plugins = [],
  loaders = {},
  dataloaderOptions = {},
  context,
  logger,
}: RouterOptions): Promise<express.Router> {
  const router = Router();

  let yoga: YogaServerInstance<any, any> | null = null;
  const application = await createGraphQLApp({
    modules,
    schema: [...schemas],
    ...appOptions,
  });

  router.get('/health', (_, response) => {
    response.json({ status: 'ok' });
  });

  router.get('/schema', (_, response) => {
    response.set('Content-Type', 'text/plain');
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
          useCSRFPrevention(),
          useGraphQLModules(application),
          useDataLoader(
            'loader',
            createLoader(
              loaders,
              dataloaderOptions,
            ),
          ),
          ...plugins,
        ],
        context: async (yogaContext: Record<string, any>) => {
          const ctx = {
            ...yogaContext,
            application,
          };
          return {
            ...ctx,
            ...(await (context instanceof Function
              ? context(ctx)
              : context)),
          };
        },
        logging: logger,
        graphqlEndpoint: req.baseUrl,
      });
    }
    return yoga(req, res, next);
  });
  router.use(errorHandler());

  return router;
}
