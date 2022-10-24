import { createRouter, providers } from '@backstage/plugin-auth-backend';
import { Router } from 'express';
import { PluginEnvironment } from '../types';

export default async function createPlugin({
  logger,
  database,
  config,
  discovery,
  tokenManager,
}: PluginEnvironment): Promise<Router> {
  return await createRouter({
    logger,
    config,
    database,
    discovery,
    tokenManager,
    providerFactories: {
      auth0: providers.auth0.create({
        signIn: {
          resolver: async (info, ctx) => {
            const {
              profile: { email },
            } = info;

            if (!email) {
              throw new Error('User profile contained no email');
            }

            const [name] = email.split('@');

            return ctx.signInWithCatalogUser({
              entityRef: { name },
            });
          },
        },
      }),
    },
  });
}
