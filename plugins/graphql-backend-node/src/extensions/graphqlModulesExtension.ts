import { createExtensionPoint } from '@backstage/backend-plugin-api';
import { GraphQLModule } from '@frontside/hydraphql';
import { Module } from 'graphql-modules';

/** @public */
export interface GraphQLModulesExtensionPoint<T = Module | GraphQLModule> {
  addModules(
    modules: ((() => T | Promise<T>) | T | Promise<T>)[],
  ): void;
}

/** @public */
export const graphqlModulesExtensionPoint =
  createExtensionPoint<GraphQLModulesExtensionPoint>({
    id: 'graphql.modules',
  });
