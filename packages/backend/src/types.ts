import { Logger } from 'winston';
import { Config } from '@backstage/config';
import {
  DatabaseManager,
  PluginCacheManager,
  PluginDatabaseManager,
  PluginEndpointDiscovery,
  TokenManager,
  UrlReader,
} from '@backstage/backend-common';
import { PluginTaskScheduler } from '@backstage/backend-tasks';
import { PermissionEvaluator } from '@backstage/plugin-permission-common';
import { CatalogClient } from '@backstage/catalog-client';

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
  catalog: CatalogClient
};
