import { Entity, EntityName, EntityRef, parseEntityName, stringifyEntityRef } from '@backstage/catalog-model';
import Dataloader from 'dataloader';
//import { pascalCase } from 'pascal-case';
import { Catalog } from './catalog';

export interface LoaderOptions {
  catalog: Catalog;
}

export interface Loader {
  load(id: string): Promise<Entity | null>;
  loadMany(ids: string[]): Promise<Array<Entity | null>>;
}

export function encodeId(name: string | EntityName): string {
  if (typeof name === 'string') {
    return name;
  } else {
    return stringifyEntityRef(name);
  }
}

export function decodeId(id: string): EntityName {
  return parseEntityName(id);
}

export function resolveEntityType(entity: Entity): string {
  return entity.kind;
}

export function createLoader({ catalog }: LoaderOptions): Loader {
  async function fetch(ids: readonly string[]): Promise<Array<Entity | Error>> {
    return Promise.all(
      ids.map(decodeId).map(async (entityname) => {
        return catalog.getEntityByName(entityname).then(entity => {
          if (entity) {
            return entity;
          }
          return new Error(`no such node with id: '${encodeId(entityname)}'`);
        });
      }),
    );
  }

  const dataloader = new Dataloader<string, Entity>(fetch);

  async function load(id: string): Promise<TypedEntity | null> {
    const [node] = await loadMany([id]);
    return node;
  }

  async function loadMany(ids: string[]): Promise<Array<TypedEntity | null>> {
    const entities = await dataloader.loadMany(ids);
    return entities.map(entity =>
      entity instanceof Error
      ? null
      : ({
        __typeName: resolveEntityType(entity),
        ...entity
      }));
  }

  return {
    load,
    loadMany,
  };
}
