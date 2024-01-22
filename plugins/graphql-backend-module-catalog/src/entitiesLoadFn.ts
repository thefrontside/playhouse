import type { CatalogApi } from '@backstage/catalog-client';
import { Entity } from '@backstage/catalog-model';
import { getBearerTokenFromAuthorizationHeader } from '@backstage/plugin-auth-node';
import { GraphQLContext, NodeQuery } from '@frontside/hydraphql';
import { GraphQLError } from 'graphql';
import type { Request } from 'express';
import { CATALOG_SOURCE } from './constants';

export const createCatalogLoader = (catalog: CatalogApi) => ({
  [CATALOG_SOURCE]: async (
    queries: readonly (NodeQuery | undefined)[],
    context: GraphQLContext & { request?: Request }
  ): Promise<Array<Entity | GraphQLError>> => {
    // TODO: Support fields
    const request = context.request;
    const token = request ? getBearerTokenFromAuthorizationHeader(request.headers.authorization) : undefined;
    const entityRefs = queries.reduce(
      (refs, { ref } = {}, index) => (ref ? refs.set(index, ref) : refs),
      new Map<number, string>(),
    );
    const refEntries = [...entityRefs.entries()];
    const result = await catalog.getEntitiesByRefs({
      entityRefs: refEntries.map(([, ref]) => ref),
    }, { token });
    const entities: (Entity | GraphQLError)[] = Array.from({
      length: queries.length,
    });
    refEntries.forEach(
      ([key], index) =>
        (entities[key] =
          result.items[index] ??
          new GraphQLError(`no such entity with ref: '${queries[index]}'`)),
    );
    return entities;
  },
});
