import { createApiFactory, createPlugin, discoveryApiRef, createRoutableExtension } from '@backstage/core-plugin-api';
import { on, ensure, Subscription } from 'effection';
import { inspectState, InspectMessage } from '@effection/inspect-utils';

import { rootRouteRef } from './routes';
import { inspectorApiRef, InspectorAPI } from './api/inspector-api';

export const inspectorPlugin = createPlugin({
  id: 'inspector',
  apis: [
    createApiFactory({
      api: inspectorApiRef,
      deps: { discoveryApi: discoveryApiRef },
      factory({ discoveryApi,  }) {
        return {
          inspectState: () => ({
            *init(scope) {
              let url: string = yield discoveryApi.getBaseUrl('inspector');
              let source = new EventSource(url, { withCredentials: true });

              yield ensure(() => { source.close() });

              let subscription = on<MessageEvent>(source, 'message')
                .map(e => JSON.parse(e.data) as InspectMessage)
                .subscribe(scope) as Subscription<InspectMessage, undefined>;

              return yield inspectState(subscription);
            }
          })
        } as InspectorAPI
      }
    })
  ],
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
