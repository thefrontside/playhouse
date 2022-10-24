import type { Entity, CompoundEntityRef } from '@backstage/catalog-model';

export interface Environment {
  id: string;
  name: string;
}

export interface Repository {
  componentRef: string;
  slug: string;
  description?: string;
  url: string;
}

export interface RepositoryUrls {
  ssh: string;
  https: string;
}

export interface PlatformApi {
  getLogs(ref: EntityRef, environment: string): AsyncIterable<string>;
  getEnvironments(ref: EntityRef, page?: PageSpec): Promise<Page<Environment>>;
  getRepositories(page?: PageSpec): Promise<Page<Repository>>
  getRepositoryUrls(ref: EntityRef): Promise<RepositoryUrls | null>
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

export type GetComponentRef = (name: string) => Promise<EntityRef>
