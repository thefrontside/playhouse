import type { CatalogApi } from '@backstage/catalog-client';
import { Entity } from '@backstage/catalog-model';
import { NodeQuery } from '@frontside/hydraphql';
import { GraphQLError } from 'graphql';
import { CATALOG_SOURCE } from './constants';
import { TokenManagerService } from '@backstage/backend-plugin-api';


export const createCatalogLoader = (catalog: CatalogApi, tokenManager: TokenManagerService) => ({
  [CATALOG_SOURCE]: async (
    queries: readonly (NodeQuery | undefined)[],
  ): Promise<Array<Entity | GraphQLError>> => {
    // TODO: Support fields
    const entityRefs = queries.reduce(
      (refs, { ref } = {}, index) => (ref ? refs.set(index, ref) : refs),
      new Map<number, string>(),
    );
    const refEntries = [...entityRefs.entries()];
    const { token } = await tokenManager.getToken();
    const result = await catalog.getEntitiesByRefs({
      entityRefs: refEntries.map(([, ref]) => ref),
    },  { token });
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
