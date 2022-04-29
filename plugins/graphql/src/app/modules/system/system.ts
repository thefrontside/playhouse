import { resolvePackagePath } from '@backstage/backend-common';
import { loadFilesSync } from '@graphql-tools/load-files';
import { createModule } from 'graphql-modules';

export const System = createModule({
  id: `system`,
  typeDefs: loadFilesSync(resolvePackagePath('@frontside/backstage-plugin-graphql', 'src/app/modules/system/system.graphql')),
});
