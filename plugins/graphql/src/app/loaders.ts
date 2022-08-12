import type { CatalogApi, EntityRef, EntityLoader } from './types';
import { Entity } from '@backstage/catalog-model';
import { EnvelopError } from '@envelop/core';
import DataLoader from 'dataloader';

export interface LoaderOptions {
  catalog: CatalogApi;
}

export function createLoader({ catalog }: LoaderOptions): EntityLoader {
  return new DataLoader<EntityRef, Entity>(function fetch(refs): Promise<Array<Entity | Error>> {
    return Promise.all(refs.map(async ref => {
      let entity = await catalog.getEntityByRef(ref);
      return entity ?? new EnvelopError(`no such node with ref: '${ref}'`);
    }));
  });
}
