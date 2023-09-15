import { createExtensionPoint } from '@backstage/backend-plugin-api';
import { GraphQLContext } from '@frontside/hydraphql';

/** @public */
export interface GraphQLContextExtensionPoint {
  setContext<TContext extends Record<string, any>>(
    context:
      | ((initialContext: GraphQLContext) => TContext | Promise<TContext>)
      | Promise<TContext>
      | TContext,
  ): void;
}

/** @public */
export const graphqlContextExtensionPoint =
  createExtensionPoint<GraphQLContextExtensionPoint>({
    id: 'graphql.context',
  });
