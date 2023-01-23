import { stringifyEntityRef } from '@backstage/catalog-model';
import {
  createRouter,
  providers,
  defaultAuthProviderFactories,
} from '@backstage/plugin-auth-backend';
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
      ...defaultAuthProviderFactories,
      auth0: providers.auth0.create({
        signIn: {
          resolver: async ({ profile }, ctx) => {
            if (!profile?.email) {
              throw new Error('User profile contained no email');
            }

            const [name, domain] = profile?.email?.split('@');
            // when we want to find the user in the catalog,
            //  use this function
            // return ctx.signInWithCatalogUser({
            //   entityRef: { name },
            // });

            // otherwise we can sign in without having the
            //  user in the catalog
            //  https://backstage.io/docs/auth/identity-resolver#sign-in-without-users-in-the-catalog
            // Split the email into the local part and the domain.

            // Next we verify the email domain. It is recommended to include this
            // kind of check if you don't look up the user in an external service.
            if (domain !== 'frontside.com') {
              throw new Error(
                `Login failed, this email ${profile.email} does not belong to the expected domain`,
              );
            }

            // By using `stringifyEntityRef` we ensure that the reference is formatted correctly
            const userEntity = stringifyEntityRef({
              kind: 'User',
              name,
              namespace: 'frontside',
            });
            return ctx.issueToken({
              claims: {
                sub: userEntity,
                ent: [userEntity],
              },
            });
          },
        },
      }),
    },
  });
}
