import { CatalogClient } from '@backstage/catalog-client';
import { CompoundEntityRef } from '@backstage/catalog-model';
import DataLoader from 'dataloader';
import { Application } from 'graphql-modules';

export type PromiseOrValue<T> = T | Promise<T>;

export interface ResolverContext {
  application: Application;
  loader: DataLoader<any, any>;
  catalog: CatalogClient;
  refToId?: (ref: CompoundEntityRef | string) => string;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type Logger = Record<LogLevel, (...args: any[]) => void>;
