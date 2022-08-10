/* eslint-disable func-names */
/* eslint-disable jest/no-standalone-expect */
import { describe, beforeAll, it } from '@effection/jest';
import { DatabaseManager, getRootLogger, ServerTokenManager, SingleHostDiscovery, UrlReaders } from '@backstage/backend-common';
import { ScaffolderEntitiesProcessor } from '@backstage/plugin-scaffolder-backend';
import { CatalogBuilder, CatalogEnvironment } from '@backstage/plugin-catalog-backend';
import { ServerPermissionClient } from '@backstage/plugin-permission-node';
import {
  ScmIntegrations,
  DefaultGithubCredentialsProvider
} from '@backstage/integration';
import { GitHubOrgEntityProvider } from '@backstage/plugin-catalog-backend-module-github';

import { ConfigReader } from '@backstage/config';
import { BatchLoader } from '..'
import { backstageConfig } from './config';

async function createCatalogPlugin(env: CatalogEnvironment,): Promise<void> {
  const builder = await CatalogBuilder.create(env);
  builder.addProcessor(new ScaffolderEntitiesProcessor());

  const integrations = ScmIntegrations.fromConfig(env.config);
  const githubCredentialsProvider = DefaultGithubCredentialsProvider.fromIntegrations(integrations);

  const gitProvider = GitHubOrgEntityProvider.fromConfig(env.config, {
    id: "thefrontside",
    orgUrl: "https://github.com/thefrontside",
    logger: env.logger,
    githubCredentialsProvider
  });
  builder.addEntityProvider(gitProvider);

  const { processingEngine } = await builder.build();
  await processingEngine.start();
}

describe('loading entities in a batch', () => {
  let loader: BatchLoader

  beforeAll(function* () {
    const logger = getRootLogger();
    const config = new ConfigReader(backstageConfig);
    const reader = UrlReaders.default({ logger, config });
    const databaseManager = DatabaseManager.fromConfig(config);
    const discovery = SingleHostDiscovery.fromConfig(config);
    const tokenManager = ServerTokenManager.noop();
    const permissions = ServerPermissionClient.fromConfig(config, {
      discovery,
      tokenManager,
    });
    yield createCatalogPlugin({
      logger,
      database: databaseManager.forPlugin('catalog'),
      config,
      reader,
      permissions,
    })
    loader = new BatchLoader({ databaseManager, logger })
    yield loader.init()
  });

  it('can look up a entity by stringified ref', function* () {
    const [teamA] = yield loader.getEntitiesByRefs(['group:default/team-a'])
    expect(teamA).toMatchObject({ metadata: { description: "Team A" } });
  });

  it('can look up a entity by compound ref', function* () {
    const [teamA] = yield loader.getEntitiesByRefs([{ kind: 'group', namespace: 'default', name: 'team-a' }])
    expect(teamA).toMatchObject({ metadata: { description: "Team A" } });
  });

  it('can look up entities in a right order', function* () {
    const [teamA, teamB, teamC] = yield loader.getEntitiesByRefs(['group:default/team-a', 'group:default/team-b', 'group:default/team-c'])
    expect(teamA).toMatchObject({ metadata: { description: "Team A" } });
    expect(teamB).toMatchObject({ metadata: { description: "Team B" } });
    expect(teamC).toMatchObject({ metadata: { description: "Team C" } });
  });
})
