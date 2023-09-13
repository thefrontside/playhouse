import { createExtensionPoint } from '@backstage/backend-plugin-api';
import { BatchLoadFn, GraphQLContext } from '@frontside/hydraphql';

/** @public */
export interface GraphQLLoadersExtensionPoint {
  addLoaders(loaders: Record<string, BatchLoadFn<GraphQLContext>>): void;
}

/** @public */
export const graphqlLoadersExtensionPoint =
  createExtensionPoint<GraphQLLoadersExtensionPoint>({
    id: 'graphql.loaders',
  });
