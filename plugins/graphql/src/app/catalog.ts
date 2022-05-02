import type { CatalogApi } from '@backstage/catalog-client';

export type Catalog = Pick<CatalogApi, 'getEntities' | 'getEntityByRef'>;
