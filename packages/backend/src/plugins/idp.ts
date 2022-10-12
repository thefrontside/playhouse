import type { Router } from 'express';
import { createRouter } from '@frontside/backstage-plugin-platform-backend';
import { PluginEnvironment } from '../types';

export default async function createPlugin({
  config,
  logger,
  discovery,
  catalog,
}: PluginEnvironment): Promise<Router> {
  return await createRouter({
    executableName: 'idp',
    logger,
    discovery,
    appURL: `${config.getString('app.baseUrl')}/platform`,
    catalog
  });
}
