import { createRouter } from '@frontside/backstage-plugin-graphql';
import { Router } from 'express';
import { PluginEnvironment } from '../types';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  return await createRouter({
    logger: env.logger,
    catalog: env.catalog,
  });
}
