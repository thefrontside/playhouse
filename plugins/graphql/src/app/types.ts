import type { CatalogApi as Client } from '@backstage/catalog-client';
import type { Entity } from '@backstage/catalog-model';

export interface ResolverContext {
  loader: Loader
  catalog: CatalogApi
}

export interface Loader {
  load(id: string): Promise<Entity | null>;
  loadMany(ids: string[]): Promise<Array<Entity | null>>;
}

export type CatalogApi = Pick<Client, "getEntityByRef">;
