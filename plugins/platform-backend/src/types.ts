import type { Entity, CompoundEntityRef } from '@backstage/catalog-model';

export interface Environment {
  id: string;
  name: string;
}

export interface PlatformApi {
  getEnvironments(ref: EntityRef, page?: PageSpec): Promise<Page<Environment>>;
}

export interface EntityRef {
  ref: string;
  compound: CompoundEntityRef;
  load(): Promise<Entity>;
}

export interface Page<T> {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  beginCursor: string;
  endCursor: string;
  items: {
    cursor: string;
    value: T;
  }[];
}

export type PageSpec = {
  count: number;
  before: string;
} | {
  count: number;
  after: string;
}
