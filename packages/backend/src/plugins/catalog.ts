import {
  DefaultGithubCredentialsProvider, ScmIntegrations
} from '@backstage/integration';
import {
  EntityProvider
} from '@backstage/plugin-catalog-backend';
import { GitHubOrgEntityProvider } from '@backstage/plugin-catalog-backend-module-github';
import { ScaffolderEntitiesProcessor } from '@backstage/plugin-scaffolder-backend';
import { createCatalogBuilder } from '@frontside/backstage-plugin-incremental-ingestion-backend';
import { createGithubRepositoryEntityProvider } from '@frontside/backstage-plugin-incremental-ingestion-github';
import { Router } from 'express';
import { Duration } from 'luxon';
import { PluginEnvironment } from '../types';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {

  const integrations = ScmIntegrations.fromConfig(env.config);
  const githubCredentialsProvider = DefaultGithubCredentialsProvider.fromIntegrations(integrations);

  const builder = createCatalogBuilder(env);

  const githubIntegration = integrations.github.byHost('github.com');

  if (githubIntegration) {
    builder.addIncrementalEntityProvider(
      createGithubRepositoryEntityProvider({
        id: 'github.com',
        credentialsProvider: githubCredentialsProvider,
        integration: githubIntegration,
        logger: env.logger,
        searchQuery: "created:>1970-01-01 user:thefrontside"
      }),
      {
        burstInterval: Duration.fromObject({ seconds: 3 }),
        burstLength: Duration.fromObject({ seconds: 3 }),
        restLength: Duration.fromObject({ day: 1 })
      }
    )
  }

  builder.addProcessor(new ScaffolderEntitiesProcessor());

  const gitProvider = GitHubOrgEntityProvider.fromConfig(env.config, {
    id: "thefrontside",
    orgUrl: "https://github.com/thefrontside",
    logger: env.logger,
    githubCredentialsProvider
  });

  builder.addEntityProvider(gitProvider as EntityProvider);

  const { processingEngine, router } = await builder.build();

  await processingEngine.start();
  
  router.post('/github/webhook', async (req, _res) => {
    const event = req.headers["x-github-event"];
    if (event === "membership" || event === "organization") {
      await gitProvider.read();
      env.logger.info("Successfully triggered database update via github webhook event");
    }
    // TODO: we should forward requests to smee for local development
  });

  await env.scheduler.scheduleTask({
    id: "githubEntityProvider-scheduledTask",
    fn: async () => { await gitProvider.read()},
    frequency: Duration.fromObject({ day: 1 }),
    timeout: Duration.fromObject({ minutes: 5 })
  })

  return router;
}
