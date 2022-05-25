import { CatalogClient } from '@backstage/catalog-client';
import { createBuiltinActions, createRouter } from '@backstage/plugin-scaffolder-backend';
import { Router } from 'express';
import type { PluginEnvironment } from '../types';
import { ScmIntegrations } from '@backstage/integration';
import { buildAndPushAction } from "./scaffolder/action/build-and-upload";
import { deployHumanitec } from "./scaffolder/action/deploy-humanitec";

export default async function createPlugin({
  logger,
  config,
  database,
  reader,
  discovery,
}: PluginEnvironment): Promise<Router> {
  const catalogClient = new CatalogClient({ discoveryApi: discovery });
  const integrations = ScmIntegrations.fromConfig(config);
  const builtInActions = createBuiltinActions({
    integrations,
    catalogClient,
    config: config,
    reader: reader,
  });
  const actions = [
    ...builtInActions,
    buildAndPushAction(integrations),
    deployHumanitec()
  ];
  return await createRouter({
    logger,
    config,
    database,
    catalogClient,
    reader,
    actions,
  });
}
