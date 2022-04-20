import { resolvePackagePath } from '@backstage/backend-common';
import { Entity, SystemEntity } from '@backstage/catalog-model';
import { loadFilesSync } from '@graphql-tools/load-files';
import { createModule } from 'graphql-modules';
import { resolverProvider } from '../resolver';

export const System = createModule({
  id: `system`,
  typeDefs: loadFilesSync(resolvePackagePath('@internal/plugin-graphql', 'typedefs/system.graphql')),
  providers: [
    resolverProvider({
      accept: (entity: Entity): entity is SystemEntity => entity.kind === 'System',
      resolve: entity => entity ? ({ __typeName: 'System', ...entity }) : null,
    }),
  ],
});
