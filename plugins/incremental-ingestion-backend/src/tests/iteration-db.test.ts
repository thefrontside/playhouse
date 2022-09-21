/* eslint-disable func-names */
import { describe, beforeAll, it } from '@effection/jest';
import { TaskScheduler } from '@backstage/backend-tasks';
import { ServerPermissionClient } from '@backstage/plugin-permission-node';
import { CatalogClient } from '@backstage/catalog-client';
import { ConfigReader } from '@backstage/config';
import { backstageConfig } from './config';
import { createServiceBuilder, DatabaseManager, ServerTokenManager, SingleHostDiscovery, UrlReaders } from '@backstage/backend-common';
import { ClientFactory, useCatalogPlugin, useLogger } from './setupTests';

describe('incrementally ingest entities', () => {
  const factory = new ClientFactory();
  let catalog: CatalogClient;

  beforeAll(function* () {
    // TODO Drop db before each test
    const logger = yield useLogger()
    const config = new ConfigReader(backstageConfig);
    const reader = UrlReaders.default({ logger, config });
    const databaseManager = DatabaseManager.fromConfig(config);
    const discovery = SingleHostDiscovery.fromConfig(config);
    const tokenManager = ServerTokenManager.noop();
    const permissions = ServerPermissionClient.fromConfig(config, { discovery, tokenManager });
    const scheduler = TaskScheduler.fromConfig(config).forPlugin('catalog');
    const router = yield useCatalogPlugin({
      logger,
      database: databaseManager.forPlugin('catalog'),
      config,
      reader,
      permissions,
      scheduler,
    }, factory)
    const service = createServiceBuilder(module)
    .loadConfig(config)
    .addRouter('/api', router)
    service.start();
    catalog = new CatalogClient({ discoveryApi: discovery });
  });

  it.eventually('successfuly ingest data', function* () {
    console.log('catalog0');
    yield factory.createClient([
      { id: 1, data: ['a', 'b', 'c', 'd', 'e'], delay: 10 },
    ]);
    console.log('catalog1');
    yield new Promise(resolve => setTimeout(resolve, 1000));
    console.log(yield catalog.getEntities());
    yield factory.createClient([
      { id: 1, data: ['1', '2', '3', '4', '5'], delay: 10 },
    ]);
    yield new Promise(resolve => setTimeout(resolve, 1000));
    console.log(yield catalog.getEntities());
  }, 30000)
})
