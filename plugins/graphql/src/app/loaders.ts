import { ApiEntity, ComponentEntity, Entity, GroupEntity, ResourceEntity, CompoundEntityRef } from '@backstage/catalog-model';
import { TemplateEntityV1beta3 } from '@backstage/plugin-scaffolder-common'
import Dataloader from 'dataloader';
import { pascalCase } from 'pascal-case';
import { Catalog } from './catalog';

type EntityRef = string | CompoundEntityRef

export interface TypedEntity extends Entity {
  __typeName: string;
}

export interface LoaderOptions {
  catalog: Catalog;
}

export interface Loader {
  load(id: string): Promise<TypedEntity | null>;
  loadMany(ids: string[]): Promise<Array<TypedEntity | null>>;
}

export function resolveEntityType(entity: Entity): string {
  switch (entity.kind) {
    case 'API': return pascalCase((entity as ApiEntity).spec.type)
    case 'Component': return pascalCase((entity as ComponentEntity).spec.type)
    case 'Resource': return pascalCase((entity as ResourceEntity).spec.type)
    case 'Template': return pascalCase((entity as TemplateEntityV1beta3).spec.type)
    case 'Group': return pascalCase((entity as GroupEntity).spec.type)
    default: return entity.kind
  }
}

export function createLoader({ catalog }: LoaderOptions): Loader {
  async function fetch(refs: readonly EntityRef[]): Promise<Array<Entity | Error>> {
    return Promise.all(
      refs.map(async (ref) => {
        return catalog.getEntityByRef(ref).then(entity => {
          if (entity) {
            return entity;
          }
          return new Error(`no such node with id: '${ref}'`);
        });
      }),
    );
  }

  const dataloader = new Dataloader<EntityRef, Entity>(fetch);

  async function load(ref: EntityRef): Promise<TypedEntity | null> {
    const [node] = await loadMany([ref]);
    return node;
  }

  async function loadMany(refs: EntityRef[]): Promise<Array<TypedEntity | null>> {
    const entities = await dataloader.loadMany(refs);
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
