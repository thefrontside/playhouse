import type { JsonObject } from '@backstage/types';

import {
  createGraphQLApp,
  GraphQLContext,
  CoreSync,
} from '@frontside/hydraphql';

import * as graphql from 'graphql';
import DataLoader from 'dataloader';
import { Module } from 'graphql-modules';
import { envelop, useEngine } from '@envelop/core';
import { useDataLoader } from '@envelop/dataloader';
import { useGraphQLModules } from '@envelop/graphql-modules';
import { RelationSync } from '../relation';

export async function createGraphQLAPI(
  TestModule: Module,
  loader: (context: GraphQLContext) => DataLoader<any, any>,
  generateOpaqueTypes?: boolean,
) {
  const application = await createGraphQLApp({
    modules: [CoreSync(), RelationSync(), TestModule],
    generateOpaqueTypes,
  });

  const run = envelop({
    plugins: [
      useEngine(graphql),
      useGraphQLModules(application),
      useDataLoader('loader', loader),
    ],
  });

  return async (query: string): Promise<JsonObject> => {
    const { parse, validate, contextFactory, execute, schema } = run();
    const document = parse(`{ ${query} }`);
    const errors = validate(schema, document);
    if (errors.length) {
      throw errors[0];
    }
    const contextValue = await contextFactory();

    const result = await execute({
      schema: application.schema,
      document,
      contextValue,
    });
    if (result.errors) {
      throw result.errors[0];
    } else {
      return result.data as JsonObject;
    }
  };
}
