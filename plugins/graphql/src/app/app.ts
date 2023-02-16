import { Logger } from 'winston';
import { createApplication, Module } from 'graphql-modules';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { Catalog } from './modules/catalog/catalog';
import { Core } from './modules/core/core';
import { transformDirectives } from './mappers';

export type createGraphQLAppOptions = {
  modules?: Module[];
  logger?: Logger;
};

export function createGraphQLApp(options: createGraphQLAppOptions) {
  const { modules } = options;
  return createApplication({
    schemaBuilder: input => transformDirectives(makeExecutableSchema(input), options),
    modules: [Core, Catalog, ...(modules ?? [])],
  });
}
