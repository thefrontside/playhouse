import { createPlugin, createRoutableExtension } from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const inspectorPlugin = createPlugin({
  id: 'inspector',
  routes: {
    root: rootRouteRef,
  },
});

export const InspectorPage = inspectorPlugin.provide(
  createRoutableExtension({
    name: 'InspectorPage',
    component: () =>
      import('./components/InspectorPage').then(m => m.InspectorPage),
    mountPoint: rootRouteRef,
  }),
);
