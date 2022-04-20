import { resolvePackagePath } from '@backstage/backend-common';
import { loadFilesSync } from '@graphql-tools/load-files';
import { createModule } from 'graphql-modules';

export const User = createModule({
  id: `user`,
  typeDefs: loadFilesSync(resolvePackagePath('@internal/plugin-graphql', 'typedefs/user.graphql')),
});
