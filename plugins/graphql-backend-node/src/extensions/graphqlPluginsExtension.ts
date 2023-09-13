import { createExtensionPoint } from '@backstage/backend-plugin-api';
import { Plugin } from 'graphql-yoga';

/** @public */
export interface GraphQLPluginsExtensionPoint {
  addPlugins(plugins: Plugin[]): void;
}

/** @public */
export const graphqlPluginsExtensionPoint =
  createExtensionPoint<GraphQLPluginsExtensionPoint>({
    id: 'graphql.plugins',
  });
