import { CatalogClient } from '@backstage/catalog-client';
import { ScmIntegrations } from '@backstage/integration';
import { createBuiltinActions, createRouter } from '@backstage/plugin-scaffolder-backend';
import { createHumanitecApp } from "@frontside/backstage-plugin-humanitec-backend";
import { Router } from 'express';
import { createGetEnvironmentAction } from '../actions/get-environment';
import { createAddAnnotation } from '../actions/add-annotation';
import type { PluginEnvironment } from '../types';

export default async function createPlugin({
  logger,
  config,
  database,
  reader,
  discovery,
  identity
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
    createAddAnnotation(),
    createGetEnvironmentAction({
      orgId: config.getString('humanitec.orgId'),
      registryUrl: config.getString('humanitec.registryUrl'),
    }),
    createHumanitecApp({
      orgId: config.getString('humanitec.orgId'),
      token: config.getString('humanitec.token')
    })
  ];
  return await createRouter({
    logger,
    config,
    database,
    catalogClient,
    identity,
    reader,
    actions,
  });
}
