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
} from '@backstage/core-plugin-api';
import {
  graphQlBrowseApiRef,
  GraphQLEndpoints,
} from '@backstage/plugin-graphiql';

export const apis: AnyApiFactory[] = [
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
          title: 'Backstage Backend',
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
