import { resolvePackagePath } from '@backstage/backend-common';
import { loadFilesSync } from '@graphql-tools/load-files';
import { createModule } from 'graphql-modules';

export const Resource = createModule({
  id: `resource`,
  typeDefs: loadFilesSync(resolvePackagePath('@internal/plugin-graphql', 'typedefs/resource.graphql')),
});
