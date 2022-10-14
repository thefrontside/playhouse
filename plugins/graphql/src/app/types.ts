import type { CatalogApi as Client } from '@backstage/catalog-client';
import type { CompoundEntityRef, Entity } from '@backstage/catalog-model';
import { envelop, Plugin } from '@envelop/core';
import DataLoader from 'dataloader';

export type EntityRef = string | CompoundEntityRef

export type Loader = DataLoader<EntityRef, Entity>;

export interface ResolverContext<TLoader extends DataLoader<any, any> = Loader> {
  loader: TLoader
}

export type CatalogApi = Pick<Client, "getEntityByRef">;

export type EnvelopPlugins = Parameters<typeof envelop>[0]['plugins']

type Merge<T> = {
  [K in T extends any ? keyof T : never]: T extends { [key in K]: infer V }
  ? V
  : never
}

export type Context<TPlugins extends EnvelopPlugins> = Merge<(
  TPlugins extends Array<infer TPlugin>
    ? TPlugin extends Plugin<infer TContext>
      ? TContext
      : never
    : never
)>;
