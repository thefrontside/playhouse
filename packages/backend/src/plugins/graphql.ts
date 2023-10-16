import { Catalog, createCatalogLoader } from '@frontside/backstage-plugin-graphql-backend-module-catalog';
import { createRouter } from '@frontside/backstage-plugin-graphql-backend';
import { Router } from 'express';
import { PluginEnvironment } from '../types';
import { myModule } from '../graphql/my-module';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  return await createRouter({
    logger: env.logger,
    modules: [myModule, Catalog()],
    loaders: { ...createCatalogLoader(env.catalog) },
  });
}
