import { Entity, EntityName } from '@backstage/catalog-model';
import Dataloader from 'dataloader';
import { Catalog } from './catalog';
import { Node, Mapper } from './mappers';

export interface TypedEntityName extends EntityName {
  typename: string;
}

export interface Key {
  id: string;
  typename: string;
  entityname: EntityName;
}

export interface LoaderOptions {
  catalog: Catalog;
  mapper: Mapper;
}

export interface Loader {
  load(id: string): Promise<Node | null>;
  loadMany(ids: string[]): Promise<Array<Node | null>>;
  loadEntity<T extends Entity = Entity>(id: string): Promise<T>;
}

export function encodeId(name: TypedEntityName): string {
  return Buffer.from(JSON.stringify(name), 'utf-8').toString('base64');
}

export function decodeId(id: string): Key {
  const { typename, ...entityname } = JSON.parse(
    Buffer.from(id, 'base64').toString('utf-8'),
  ) as TypedEntityName;
  return { id, typename, entityname };
}

export function createLoader({
  catalog,
  mapper,
}: LoaderOptions): Loader {
  async function fetch(ids: readonly string[]): Promise<Array<Entity | Error>> {
    return Promise.all(
      ids.map(decodeId).map(async ({ entityname, id }) => {
        return catalog.getEntityByName(entityname).then(entity => {
          if (entity) {
            return entity;
          }
          return new Error(`no such node with id: '${id}'`);
        });
      }),
    );
  }

  const dataloader = new Dataloader<string, Entity>(fetch);

  async function load(id: string): Promise<Node | null> {
    const [node] = await loadMany([id]);
    return node;
  }

  async function loadMany(ids: string[]): Promise<Array<Node | null>> {
    const entities = await dataloader.loadMany(ids);
    return entities.map(entity => (entity instanceof Error ? null : mapper.toNode(entity)));
  }

  async function loadEntity<T extends Entity = Entity>(id: string): Promise<T> {
    const entity = await dataloader.load(id);
    if (entity instanceof Error) {
      throw Error;
    } else {
      return entity as T;
    }
  }

  return {
    load,
    loadMany,
    loadEntity,
  };
}
