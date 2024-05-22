import {
  ScmIntegrationsApi,
  scmIntegrationsApiRef,
  ScmAuth,
} from '@backstage/integration-react';
import {
  AnyApiFactory,
  configApiRef,
  createApiFactory,
  githubAuthApiRef,
  errorApiRef,
  discoveryApiRef,
  oauthRequestApiRef,
} from '@backstage/core-plugin-api';
import {
  graphQlBrowseApiRef,
  GraphQLEndpoints,
} from '@backstage-community/plugin-graphiql';
import { OAuth2 } from '@backstage/core-app-api';
import { auth0AuthApiRef } from './internal';

export const apis: AnyApiFactory[] = [
  createApiFactory({
    api: auth0AuthApiRef,
    deps: {
      discoveryApi: discoveryApiRef,
      oauthRequestApi: oauthRequestApiRef,
      configApi: configApiRef,
    },
    factory: ({ discoveryApi, oauthRequestApi, configApi }) =>
      OAuth2.create({
        discoveryApi,
        oauthRequestApi,
        provider: {
          id: 'auth0',
          title: 'Auth0',
          icon: () => null,
        },
        defaultScopes: ['openid', 'email', 'profile', 'offline_access'],
        environment: configApi.getOptionalString('auth.environment'),
      }),
  }),
  createApiFactory({
    api: scmIntegrationsApiRef,
    deps: { configApi: configApiRef },
    factory: ({ configApi }) => ScmIntegrationsApi.fromConfig(configApi),
  }),
  ScmAuth.createDefaultApiFactory(),
  createApiFactory({
    api: graphQlBrowseApiRef,
    deps: {
      errorApi: errorApiRef,
      githubAuthApi: githubAuthApiRef,
      discovery: discoveryApiRef,
    },
    factory: ({ errorApi, githubAuthApi, discovery }) =>
      GraphQLEndpoints.from([
        {
          id: 'backstage-backend',
          title: 'Backstage GraphQL API',
          // we use the lower level object with a fetcher function
          // as we need to `await` the backend url for the graphql plugin
          fetcher: async (params: any) => {
            const graphqlURL = await discovery.getBaseUrl('graphql');
            return fetch(graphqlURL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(params),
            }).then(res => res.json());
          },
        },
        GraphQLEndpoints.github({
          id: 'github',
          title: 'GitHub',
          errorApi,
          githubAuthApi,
        }),
        // example, remove in the future?
        GraphQLEndpoints.create({
          id: 'swapi',
          title: 'Star Wars API',
          url: 'https://swapi-graphql.netlify.app/.netlify/functions/index',
        }),
      ]),
  }),
];
