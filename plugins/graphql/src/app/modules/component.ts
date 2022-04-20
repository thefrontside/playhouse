import { resolvePackagePath } from '@backstage/backend-common';
import { ComponentEntity, Entity } from '@backstage/catalog-model';
import { loadFilesSync } from '@graphql-tools/load-files';
import { createModule } from 'graphql-modules';
import { pascalCase } from 'pascal-case'
import { resolverProvider } from '../resolver';

export const Component = createModule({
  id: `component`,
  typeDefs: loadFilesSync(resolvePackagePath('@internal/plugin-graphql', 'typedefs/component.graphql')),
  resolvers: {
    Lifecycle: {
      EXPERIMENTAL: 'experimental',
      PRODUCTION: 'production',
      DEPRECATED: 'deprecated',
    },
  },
  providers: [
    resolverProvider({
      accept: (entity: Entity): entity is ComponentEntity => entity.kind === 'Component',
      resolve: entity => entity ? ({ __typeName: pascalCase(entity.spec.type), ...entity }) : null,
    }),
  ],
});
