import { CatalogClient } from '@backstage/catalog-client';
import { createBuiltinActions, createRouter } from '@backstage/plugin-scaffolder-backend';
import { Router } from 'express';
import type { PluginEnvironment } from '../types';
import { ScmIntegrations } from '@backstage/integration';
import { createHumanitecApp } from "@frontside/backstage-plugin-humanitec-backend";
import { createGetEnvironmentAction } from '../actions/get-environment';

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
    createGetEnvironmentAction({
      orgId: config.getString('humanitec.orgId'),
      registryUrl: config.getString('humanitec.registryUrl'),
    }),
    createHumanitecApp({
      orgId: config.getString('humanitec.orgId'),
      api: `${await discovery.getBaseUrl('proxy')}/humanitec`
    })
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
