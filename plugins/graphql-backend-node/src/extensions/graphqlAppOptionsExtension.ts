import { createExtensionPoint } from '@backstage/backend-plugin-api';

/** @public */
export interface GraphQLAppOptions {
  generateOpaqueTypes?: boolean;
}

/** @public */
export interface GraphQLAppOptionsExtensionPoint {
  setAppOptions(appOptions: GraphQLAppOptions): void;
}

/** @public */
export const graphqlAppOptionsExtensionPoint =
  createExtensionPoint<GraphQLAppOptionsExtensionPoint>({
    id: 'graphql.appOptions',
  });
