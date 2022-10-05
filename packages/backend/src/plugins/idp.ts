import type { Router } from 'express';
import { createRouter } from '@frontside/backstage-plugin-platform-backend';
import { PluginEnvironment } from '../types';

export default async function createPlugin({
  logger,
  discovery,
}: PluginEnvironment): Promise<Router> {
  return await createRouter({ logger, discovery });
}
