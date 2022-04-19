import { 
  CatalogBuilder,
  EntityProvider,
} from '@backstage/plugin-catalog-backend';
import { ScaffolderEntitiesProcessor } from '@backstage/plugin-scaffolder-backend';
import { Router } from 'express';
import { PluginEnvironment } from '../types';
import {
  ScmIntegrations,
  DefaultGithubCredentialsProvider
} from '@backstage/integration';
import { GitHubOrgEntityProvider } from '@backstage/plugin-catalog-backend-module-github';
import { Duration } from 'luxon';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
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
  builder.addEntityProvider(gitProvider as EntityProvider);

  const { processingEngine, router } = await builder.build();
  await processingEngine.start();
  
  router.post('/github/webhook', async (_req, res) => {
    await gitProvider.read();
    res.end("successfully trigger entity provider read via webhook event");
  })

  await env.scheduler.scheduleTask({
    id: "githubEntityProvider-scheduledTask",
    fn: async () => { await gitProvider.read()},
    frequency: Duration.fromObject({ day: 1 }),
    timeout: Duration.fromObject({ minutes: 5 })
  })

  return router;
}
