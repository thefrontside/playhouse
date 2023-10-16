import type { Logger } from 'winston';
import type { Config } from '@backstage/config';
import type {
  DatabaseManager,
  PluginCacheManager,
  PluginDatabaseManager,
  PluginEndpointDiscovery,
  TokenManager,
  UrlReader,
} from '@backstage/backend-common';
import type { PluginTaskScheduler } from '@backstage/backend-tasks';
import type { IdentityApi } from '@backstage/plugin-auth-node';
import type { PermissionEvaluator } from '@backstage/plugin-permission-common';
import type { CatalogClient } from '@backstage/catalog-client';

export type PluginEnvironment = {
  logger: Logger;
  database: PluginDatabaseManager;
  databaseManager: DatabaseManager;
  cache: PluginCacheManager;
  config: Config;
  reader: UrlReader;
  discovery: PluginEndpointDiscovery;
  tokenManager: TokenManager;
  scheduler: PluginTaskScheduler;
  permissions: PermissionEvaluator;
  identity: IdentityApi;
  catalog: CatalogClient;
};
