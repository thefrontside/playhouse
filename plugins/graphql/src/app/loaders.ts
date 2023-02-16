import type { CatalogClient } from '@backstage/catalog-client';
import { Entity } from '@backstage/catalog-model';
import { default as DataLoader, Options } from 'dataloader';
import { GraphQLError } from 'graphql';

export function createLoader(
  { catalog }: { catalog: Pick<CatalogClient, 'getEntitiesByRefs'> },
  options?: Options<string, Entity>,
) {
  return new DataLoader<string, Entity>(
    async (entityRefs): Promise<Array<Entity | Error>> => {
      const result = await catalog.getEntitiesByRefs({
        entityRefs: entityRefs as string[],
      });
      return result.items.map(
        (entity, index) =>
          entity ??
          new GraphQLError(`no such node with ref: '${entityRefs[index]}'`),
      );
    },
    options,
  );
}
