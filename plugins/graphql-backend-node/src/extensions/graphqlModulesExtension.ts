import { createExtensionPoint } from '@backstage/backend-plugin-api';
import { Module } from 'graphql-modules';

/** @public */
export interface GraphQLModulesExtensionPoint {
  addModules(
    modules: ((() => Module | Promise<Module>) | Module | Promise<Module>)[],
  ): void;
}

/** @public */
export const graphqlModulesExtensionPoint =
  createExtensionPoint<GraphQLModulesExtensionPoint>({
    id: 'graphql.modules',
  });
