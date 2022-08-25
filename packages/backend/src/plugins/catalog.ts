import {
  DefaultGithubCredentialsProvider, ScmIntegrations
} from '@backstage/integration';
import {
  CatalogBuilder
} from '@backstage/plugin-catalog-backend';
import { ScaffolderEntitiesProcessor } from '@backstage/plugin-scaffolder-backend';
import { IncrementalCatalogBuilder } from '@frontside/backstage-plugin-incremental-ingestion-backend';
import { createGithubRepositoryEntityProvider } from '@frontside/backstage-plugin-incremental-ingestion-github';
import { Router } from 'express';
import { Duration } from 'luxon';
import { PluginEnvironment } from '../types';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {

  const integrations = ScmIntegrations.fromConfig(env.config);
  const githubCredentialsProvider = DefaultGithubCredentialsProvider.fromIntegrations(integrations);

  const builder = CatalogBuilder.create(env);
  const incrementalBuilder = IncrementalCatalogBuilder.create(env, builder);

  const githubIntegration = integrations.github.byHost('github.com');
  if (githubIntegration) {
    incrementalBuilder.addIncrementalEntityProvider(
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

  const { processingEngine, router } = await builder.build();

  await incrementalBuilder.build();

  await processingEngine.start();

  return router;
}
