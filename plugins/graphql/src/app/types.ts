import type { CatalogApi as Client } from '@backstage/catalog-client';
import type { CompoundEntityRef, Entity } from '@backstage/catalog-model';
import DataLoader from 'dataloader';

export type EntityRef = string | CompoundEntityRef

export type Loader = DataLoader<EntityRef, Entity>;

export interface ResolverContext {
  loader: Loader
}

export type CatalogApi = Pick<Client, "getEntityByRef">;
