import { createPlugin, createRoutableExtension } from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const scaffolderFrontendWorkflowPlugin = createPlugin({
  id: 'scaffolder-frontend-workflow',
  routes: {
    root: rootRouteRef,
  },
});

export const ScaffolderFrontendWorkflowPage = scaffolderFrontendWorkflowPlugin.provide(
  createRoutableExtension({
    name: 'ScaffolderFrontendWorkflowPage',
    component: () =>
      import('./components/ExampleComponent').then(m => m.ExampleComponent),
    mountPoint: rootRouteRef,
  }),
);
