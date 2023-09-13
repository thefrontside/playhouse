import { createExtensionPoint } from '@backstage/backend-plugin-api';

/** @public */
export interface GraphQLSchemasExtensionPoint {
  addSchemas(schemas: string[]): void;
}

/** @public */
export const graphqlSchemasExtensionPoint =
  createExtensionPoint<GraphQLSchemasExtensionPoint>({
    id: 'graphql.schemas',
  });
