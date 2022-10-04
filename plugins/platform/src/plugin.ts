import { createPlugin, createRoutableExtension } from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const platformPlugin = createPlugin({
  id: 'platform',
  routes: {
    root: rootRouteRef,
  },
});

export const PlatformPage = platformPlugin.provide(
  createRoutableExtension({
    name: 'PlatformPage',
    component: () =>
      import('./components/ExampleComponent').then(m => m.ExampleComponent),
    mountPoint: rootRouteRef,
  }),
);
