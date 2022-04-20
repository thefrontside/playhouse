import { resolvePackagePath } from '@backstage/backend-common';
import { Entity, GroupEntity, UserEntity } from '@backstage/catalog-model';
import { loadFilesSync } from '@graphql-tools/load-files';
import { createModule } from 'graphql-modules';
import { pascalCase } from 'pascal-case'
import { resolverProvider } from '../resolver';

export const User = createModule({
  id: `user`,
  typeDefs: loadFilesSync(resolvePackagePath('@internal/plugin-graphql', 'typedefs/user.graphql')),
  providers: [
    resolverProvider({
      accept: (entity: Entity): entity is GroupEntity => entity.kind === 'Group',
      resolve: entity => entity ? ({ __typeName: pascalCase(entity.spec.type), ...entity }) : null,
    }),
    resolverProvider({
      accept: (entity: Entity): entity is UserEntity => entity.kind === 'User',
      resolve: entity => entity ? ({ __typeName: 'User', ...entity }) : null,
    }),
  ],
});
