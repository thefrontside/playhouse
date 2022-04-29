import { resolvePackagePath } from '@backstage/backend-common';
import { loadFilesSync } from '@graphql-tools/load-files';
import { createModule } from 'graphql-modules';

export const Domain = createModule({
  id: `domain`,
  typeDefs: loadFilesSync(resolvePackagePath('@frontside/backstage-plugin-graphql', 'src/app/modules/domain/domain.graphql')),
});
