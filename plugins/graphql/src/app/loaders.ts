import { CatalogApi } from '@backstage/catalog-client';
import { Entity, CompoundEntityRef } from '@backstage/catalog-model';
import Dataloader from 'dataloader';

type EntityRef = string | CompoundEntityRef


export interface LoaderOptions {
  catalog: CatalogApi;
}

export interface Loader {
  load(id: string): Promise<Entity | null>;
  loadMany(ids: string[]): Promise<Array<Entity | null>>;
}

export function createLoader({ catalog }: LoaderOptions): Loader {
  async function fetch(refs: readonly EntityRef[]): Promise<Array<Entity | Error>> {
    return Promise.all(
      refs.map(async (ref) => {
        return catalog.getEntityByRef(ref).then(entity => {
          if (entity) {
            return entity;
          }
          return new Error(`no such node with ref: '${ref}'`);
        });
      }),
    );
  }

  const dataloader = new Dataloader<EntityRef, Entity>(fetch);

  async function load(ref: EntityRef): Promise<Entity | null> {
    const [node] = await loadMany([ref]);
    return node;
  }

  async function loadMany(refs: EntityRef[]): Promise<Array<Entity | null>> {
    const entities = await dataloader.loadMany(refs);
    return entities.map(entity => entity instanceof Error ? null : entity);
  }

  return {
    load,
    loadMany,
  };
}
