import { resolvePackagePath } from '@backstage/backend-common';
import { DomainEntity, Entity } from '@backstage/catalog-model';
import { loadFilesSync } from '@graphql-tools/load-files';
import { createModule } from 'graphql-modules';
import { resolverProvider } from '../resolver';

export const Domain = createModule({
  id: `domain`,
  typeDefs: loadFilesSync(resolvePackagePath('@internal/plugin-graphql', 'typedefs/domain.graphql')),
  providers: [
    resolverProvider({
      accept: (entity: Entity): entity is DomainEntity => entity.kind === 'Domain',
      resolve: entity => entity ? ({ __typeName: 'Domain', ...entity }) : null,
    }),
  ],
});
