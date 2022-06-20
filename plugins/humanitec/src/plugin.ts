import { createPlugin } from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const humanitecPlugin = createPlugin({
  id: 'humanitec',
  routes: {
    root: rootRouteRef,
  },
});