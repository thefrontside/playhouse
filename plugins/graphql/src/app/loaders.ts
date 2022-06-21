import type { CatalogApi, EntityRef, Loader } from './types';
import { Entity } from '@backstage/catalog-model';
import DataLoader from 'dataloader';
import { EnvelopError } from '@envelop/core';

export interface LoaderOptions {
  catalog: CatalogApi;
}

export function createLoader({ catalog }: LoaderOptions): Loader {
  return new DataLoader<EntityRef, Entity>(async function fetch(refs): Promise<Array<Entity | Error>> {
    let entities: (Entity | Error)[] = [];

    for (let ref of refs) {
      try {
        let entity = await catalog.getEntityByRef(ref);
        if (entity) {
          entities.push(entity);
          continue;
        }
        entities.push(new EnvelopError(`no such node with ref: '${ref}'`))
      } catch (e) {
        if (e instanceof Error) {
          entities.push(e);
        }
      }
    }

    return entities;
  });
}
