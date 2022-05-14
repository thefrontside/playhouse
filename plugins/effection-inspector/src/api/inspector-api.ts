import type { Operation } from 'effection';
import type { Slice } from '@effection/atom';
import type { InspectState } from '@effection/inspect-utils';

import { createApiRef } from '@backstage/core-plugin-api';

export const inspectorApiRef = createApiRef<InspectorAPI>({
  id: 'plugin.inspector.service',
});

export interface InspectorAPI {
  inspectState(): Operation<Slice<InspectState>>;
}
