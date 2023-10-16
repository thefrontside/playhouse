import { CatalogBuilder } from '@backstage/plugin-catalog-backend';
import { ScaffolderEntitiesProcessor } from '@backstage/plugin-scaffolder-backend';
import { UnprocessedEntitiesModule } from '@backstage/plugin-catalog-backend-module-unprocessed';
import { IncrementalCatalogBuilder } from '@frontside/backstage-plugin-incremental-ingestion-backend';
import { Router } from 'express';
import { PluginEnvironment } from '../types';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  const builder = CatalogBuilder.create(env);

  // incremental builder receives builder because it'll register
  // incremental entity providers with the builder
  const incrementalBuilder = await IncrementalCatalogBuilder.create(
    env,
    builder,
  );

  builder.addProcessor(new ScaffolderEntitiesProcessor());

  const { processingEngine, router } = await builder.build();

  // this has to run after `await builder.build()` so ensure that catalog migrations are completed
  // before incremental builder migrations are executed
  await incrementalBuilder.build();

  const unprocessed = new UnprocessedEntitiesModule(
    await env.database.getClient(),
    router,
  );

  unprocessed.registerRoutes();

  await processingEngine.start();

  return router;
}
