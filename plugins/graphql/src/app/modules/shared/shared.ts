import { resolvePackagePath } from '@backstage/backend-common';
import { loadFilesSync } from '@graphql-tools/load-files';
import { createModule } from 'graphql-modules';

export const Shared = createModule({
  id: 'shared',
  typeDefs: loadFilesSync(resolvePackagePath('@frontside/backstage-plugin-graphql', 'src/app/modules/shared/shared.graphql')),
})
