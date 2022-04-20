import { resolvePackagePath } from '@backstage/backend-common';
import { Entity, ResourceEntity } from '@backstage/catalog-model';
import { loadFilesSync } from '@graphql-tools/load-files';
import { createModule } from 'graphql-modules';
import { pascalCase } from 'pascal-case'
import { resolverProvider } from '../resolver';

export const Resource = createModule({
  id: `resource`,
  typeDefs: loadFilesSync(resolvePackagePath('@internal/plugin-graphql', 'typedefs/resource.graphql')),
  providers: [
    resolverProvider({
      accept: (entity: Entity): entity is ResourceEntity => entity.kind === 'Resource',
      resolve: entity => entity ? ({ __typeName: pascalCase(entity.spec.type), ...entity }) : null,
    }),
  ],
});
