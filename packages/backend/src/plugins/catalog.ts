import {
  CatalogBuilder
} from '@backstage/plugin-catalog-backend';
import { ScaffolderEntitiesProcessor } from '@backstage/plugin-scaffolder-backend';
import { IncrementalCatalogBuilder } from '@backstage/plugin-catalog-backend-module-incremental-ingestion';
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
    config: env.config 
  })

  incrementalBuilder.addIncrementalEntityProvider(
    githubRepositoryProvider,
    {
      burstInterval: { seconds: 3 },
      burstLength: { seconds: 3 },
      restLength: { days: 1 }
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
