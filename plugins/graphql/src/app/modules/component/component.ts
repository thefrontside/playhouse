import { resolvePackagePath } from '@backstage/backend-common';
import { loadFilesSync } from '@graphql-tools/load-files';
import { createModule } from 'graphql-modules';

export const Component = createModule({
  id: `component`,
  typeDefs: loadFilesSync(resolvePackagePath('@internal/plugin-graphql', 'src/app/modules/component/component.graphql')),
  resolvers: {
    Lifecycle: {
      EXPERIMENTAL: 'experimental',
      PRODUCTION: 'production',
      DEPRECATED: 'deprecated',
    },
  },
});
