import { ApiEntity, ComponentEntity, Entity, EntityName, GroupEntity, ResourceEntity, TemplateEntityV1beta2 } from '@backstage/catalog-model';
import Dataloader from 'dataloader';
import { pascalCase } from 'pascal-case';
import { Catalog } from './catalog';

export interface TypedEntityName extends EntityName {
  typename: string;
}

export interface TypedEntity extends Entity {
  __typeName: string;
}

export interface Key {
  id: string;
  typename: string;
  entityname: EntityName;
}

export interface LoaderOptions {
  catalog: Catalog;
}

export interface Loader {
  load(id: string): Promise<TypedEntity | null>;
  loadMany(ids: string[]): Promise<Array<TypedEntity | null>>;
}

export function encodeId(name: TypedEntityName | EntityName): string {
  return Buffer.from(JSON.stringify(name), 'utf-8').toString('base64');
}

export function decodeId(id: string): Key {
  const { typename, ...entityname } = JSON.parse(
    Buffer.from(id, 'base64').toString('utf-8'),
  ) as TypedEntityName;
  return { id, typename, entityname };
}

export function resolveEntityType(entity: Entity): string {
  switch (entity.kind) {
    case 'API': return pascalCase((entity as ApiEntity).spec.type)
    case 'Component': return pascalCase((entity as ComponentEntity).spec.type)
    case 'Resource': return pascalCase((entity as ResourceEntity).spec.type)
    case 'Template': return pascalCase((entity as TemplateEntityV1beta2).spec.type)
    case 'Group': return pascalCase((entity as GroupEntity).spec.type)
    default: return entity.kind
  }
}

export function createLoader({ catalog }: LoaderOptions): Loader {
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
