import { createExtensionPoint } from '@backstage/backend-plugin-api';
import { Options } from 'dataloader';

/** @public */
export interface GraphQLDataloaderOptionsExtensionPoint {
  setDataloaderOptions(options: Options<string, any>): void;
}

/** @public */
export const graphqlDataloaderOptionsExtensionPoint =
  createExtensionPoint<GraphQLDataloaderOptionsExtensionPoint>({
    id: 'graphql.dataloaderOptions',
  });
