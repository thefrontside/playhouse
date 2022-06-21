import type { CatalogApi, EntityRef, Loader } from './types';
import { Entity } from '@backstage/catalog-model';
import DataLoader from 'dataloader';
import { EnvelopError } from '@envelop/core';

export interface LoaderOptions {
  catalog: CatalogApi;
}

export function createLoader({ catalog }: LoaderOptions): Loader {
  return new DataLoader<EntityRef, Entity>(function fetch(refs): Promise<Array<Entity | Error>> {
    return Promise.all(refs.map(async ref => {
      let entity = await catalog.getEntityByRef(ref);
      return entity ?? new EnvelopError(`no such node with ref: '${ref}'`);
    }));
  });
}
