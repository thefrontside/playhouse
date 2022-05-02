import { createRouter } from '@internal/plugin-inspector-backend';
import { Router } from 'express';
import { PluginEnvironment } from '../types';

export default async function createPlugin({
  logger,
  discovery,
}: PluginEnvironment): Promise<Router> {
  return await createRouter({ logger, discovery });
}
