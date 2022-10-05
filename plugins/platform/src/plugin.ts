import { createApiFactory, createPlugin, discoveryApiRef, createRoutableExtension } from '@backstage/core-plugin-api';
import { ExecutablesAPI, executablesApiRef } from './api/executables-api'
import { rootRouteRef } from './routes';

export const platformPlugin = createPlugin({
  id: 'platform',
  routes: {
    root: rootRouteRef,
  },
  apis: [
    createApiFactory({
      api: executablesApiRef,
      deps: { discoveryApi: discoveryApiRef },
      factory({ discoveryApi,  }) {
        return {
          async fetchExecutables() {
            let baseUrl = await discoveryApi.getBaseUrl('idp');
            let response = await fetch(`${baseUrl}/executables`);
            return await response.json();
          }
        } as ExecutablesAPI;
      }
    })
  ]
});

export const PlatformPage = platformPlugin.provide(
  createRoutableExtension({
    name: 'PlatformPage',
    component: () =>
      import('./components/ExampleComponent').then(m => m.ExampleComponent),
    mountPoint: rootRouteRef,
  }),
);
