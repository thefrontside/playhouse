import { createRouter } from '@frontside/backstage-plugin-effection-inspector-backend';
import type { Router } from 'express';
import { PluginEnvironment } from '../types';

export default async function createPlugin({
  logger,
  discovery,
}: PluginEnvironment): Promise<Router> {
  return await createRouter({ logger, discovery });
}
