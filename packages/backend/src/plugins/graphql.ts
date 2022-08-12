import { createRouter } from '@frontside/backstage-plugin-graphql';
import type { CompoundEntityRef } from '@backstage/catalog-model';
import { Router } from 'express';
import { PluginEnvironment } from '../types';
import { myModule } from '../graphql/my-module';
import DataLoader from 'dataloader';
import { BatchLoader } from '@frontside/backstage-plugin-batch-loader';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {

  const batchLoader = new BatchLoader(env);

  return await createRouter({
    modules: [myModule],
    logger: env.logger,
    catalog: env.catalog,
    entityLoaderCreator: () => new DataLoader((refs) => batchLoader.getEntitiesByRefs(refs as (string | CompoundEntityRef)[])),
  });
}
