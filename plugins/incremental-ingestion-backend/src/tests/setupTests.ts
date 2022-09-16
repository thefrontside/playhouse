/* eslint-disable func-names */
import { describe, beforeAll, it } from '@effection/vitest';
import { TaskScheduler } from '@backstage/backend-tasks';
import { CatalogBuilder } from '@backstage/plugin-catalog-backend';
import { ServerPermissionClient } from '@backstage/plugin-permission-node';
import { ensure, once, Operation } from 'effection';
import { Duration } from 'luxon';
import { createLogger, Logger, transports } from 'winston';
import { EntityIteratorResult, IncrementalCatalogBuilder } from '..';
import { IncrementalEntityProvider, IncrementalEntityProviderOptions, PluginEnvironment } from '../types';
import { ConfigReader } from '@backstage/config';
import { backstageConfig } from './config';
import { DatabaseManager, ServerTokenManager, SingleHostDiscovery, UrlReaders } from '@backstage/backend-common';

interface Page {
  data: string[];
  retries?: number;
  timeout?: number;
}

class EntityProvider implements IncrementalEntityProvider<number, void> {
  private pages: Page[] = [];

  getProviderName() { return 'EntityProvider' }

  async around(burst: () => Promise<void>): Promise<void> {
    burst();
  }

  async next(_context: void, page: number): Promise<EntityIteratorResult<number>> {
    // TODO Handle pages
    return this.pages
  }

  setData(data: Page[]) { this.pages = data }
}

function useCatalogPlugin(env: PluginEnvironment): Operation<EntityProvider> {
  return {
    name: "CatalogPlugin",
    *init() {
      const builder = CatalogBuilder.create(env);
      const incrementalBuilder = IncrementalCatalogBuilder.create(env, builder);
      const { processingEngine } = yield builder.build();
      yield incrementalBuilder.build()

      const provider = new EntityProvider();
      const schedule: IncrementalEntityProviderOptions = {
        burstInterval: Duration.fromObject({ milliseconds: 100 }),
        burstLength: Duration.fromObject({ milliseconds: 100 }),
        restLength: Duration.fromObject({ seconds: 1 }),
      }

      incrementalBuilder.addIncrementalEntityProvider(provider, schedule);

      yield processingEngine.start();
      yield ensure(() => processingEngine.stop());

      return provider;
     }
  }
}

function useLogger(): Operation<Logger> {
  return {
    name: "Logger",
    *init() {
      const transport = new transports.Console();
      const logger = createLogger({
        level: 'error',
        transports: [transport],
      });
      yield ensure(function* () {
        logger.end();
        logger.on('error', () => { /* noop */ });
        yield once(logger, 'finish')
      });
      return logger
    }
  }
}

describe('incrementally ingest entities', () => {
  let provider: EntityProvider

  beforeAll(function* () {
    const logger = yield useLogger()
    const config = new ConfigReader(backstageConfig);
    const reader = UrlReaders.default({ logger, config });
    const databaseManager = DatabaseManager.fromConfig(config);
    const discovery = SingleHostDiscovery.fromConfig(config);
    const tokenManager = ServerTokenManager.noop();
    const permissions = ServerPermissionClient.fromConfig(config, { discovery, tokenManager });
    const scheduler = TaskScheduler.fromConfig(config).forPlugin('catalog');
    provider = yield useCatalogPlugin({
      logger,
      database: databaseManager.forPlugin('catalog'),
      config,
      reader,
      permissions,
      scheduler
    })
  });

  it.eventually('successfuly ingest data', function* () {
    provider.setData([]);
  })
})
