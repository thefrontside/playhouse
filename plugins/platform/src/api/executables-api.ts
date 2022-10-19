import type { DownloadInfo } from '@frontside/backstage-plugin-platform-backend';
import { createApiRef } from '@backstage/core-plugin-api';

export const executablesApiRef = createApiRef<ExecutablesAPI>({
  id: 'plugin.platform.executables',
});

export interface ExecutablesAPI {
  fetchExecutables(): Promise<DownloadInfo>;
}
