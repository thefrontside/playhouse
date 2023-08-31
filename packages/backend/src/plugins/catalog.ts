import {
  CatalogBuilder
} from '@backstage/plugin-catalog-backend';
import { ScaffolderEntitiesProcessor } from '@backstage/plugin-scaffolder-backend';
import { IncrementalCatalogBuilder } from '@frontside/backstage-plugin-incremental-ingestion-backend';
import { GithubRepositoryEntityProvider } from '@frontside/backstage-plugin-incremental-ingestion-github';
import { Router } from 'express';
import { Duration } from 'luxon';
import { PluginEnvironment } from '../types';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  
  const builder = CatalogBuilder.create(env);
  // incremental builder receives builder because it'll register
  // incremental entity providers with the builder 
  const incrementalBuilder = await IncrementalCatalogBuilder.create(env, builder);
  
  const githubRepositoryProvider = GithubRepositoryEntityProvider.create({ 
    host: 'github.com', 
    searchQuery: "created:>1970-01-01 user:thefrontside", 
    config: env.config 
  })

  incrementalBuilder.addIncrementalEntityProvider(
    githubRepositoryProvider,
    {
      burstInterval: Duration.fromObject({ seconds: 3 }),
      burstLength: Duration.fromObject({ seconds: 3 }),
      restLength: Duration.fromObject({ day: 1 })
    }
  )

  builder.addProcessor(new ScaffolderEntitiesProcessor());

  const { processingEngine, router } = await builder.build();

  // this has to run after `await builder.build()` so ensure that catalog migrations are completed 
  // before incremental builder migrations are executed 
  await incrementalBuilder.build();

  await processingEngine.start();

  return router;
}
