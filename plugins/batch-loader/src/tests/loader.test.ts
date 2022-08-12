/* eslint-disable func-names */
/* eslint-disable jest/no-standalone-expect */
import { describe, beforeAll, it } from '@effection/jest';
import { DatabaseManager, ServerTokenManager, SingleHostDiscovery, UrlReaders } from '@backstage/backend-common';
import { CatalogBuilder, CatalogEnvironment } from '@backstage/plugin-catalog-backend';
import { ServerPermissionClient } from '@backstage/plugin-permission-node';
import { ConfigReader } from '@backstage/config';
import { BatchLoader } from '..'
import { backstageConfig } from './config';
import { ensure, once, Operation } from 'effection';
import { createLogger, Logger, transports } from 'winston';

function useCatalogPlugin(env: CatalogEnvironment): Operation<void> {
  return {
    name: "CatalogPlugin",
    *init() {
       const builder = CatalogBuilder.create(env);
       const { processingEngine } = yield builder.build();

       yield processingEngine.start();
       yield ensure(() => processingEngine.stop());
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
        logger.on('error', function () { /* noop */ });
        yield once(logger, 'finish')
      });
      return logger
    }
  }
}

describe('loading entities in a batch', () => {
  let loader: BatchLoader

  beforeAll(function* () {
    const logger = yield useLogger()
    const config = new ConfigReader(backstageConfig);
    const reader = UrlReaders.default({ logger, config });
    const databaseManager = DatabaseManager.fromConfig(config);
    const discovery = SingleHostDiscovery.fromConfig(config);
    const tokenManager = ServerTokenManager.noop();
    const permissions = ServerPermissionClient.fromConfig(config, {
      discovery,
      tokenManager,
    });
    yield useCatalogPlugin({
      logger,
      database: databaseManager.forPlugin('catalog'),
      config,
      reader,
      permissions,
    })
    loader = new BatchLoader({ databaseManager, logger })
    yield loader.init()
  });

  it.eventually('can look up a entity by stringified ref', function* () {
    const [teamA] = yield loader.getEntitiesByRefs(['group:default/team-a'])
    expect(teamA).toMatchObject({ metadata: { description: "Team A" } });
  });

  it.eventually('can look up a entity by compound ref', function* () {
    const [teamA] = yield loader.getEntitiesByRefs([{ kind: 'group', namespace: 'default', name: 'team-a' }])
    expect(teamA).toMatchObject({ metadata: { description: "Team A" } });
  });

  it.eventually('can look up entities in a right order', function* () {
    const [teamA, teamB, teamC] = yield loader.getEntitiesByRefs(['group:default/team-a', 'group:default/team-b', 'group:default/team-c'])
    expect(teamA).toMatchObject({ metadata: { description: "Team A" } });
    expect(teamB).toMatchObject({ metadata: { description: "Team B" } });
    expect(teamC).toMatchObject({ metadata: { description: "Team C" } });
  });
})
