import { resolvePackagePath } from '@backstage/backend-common';
import { loadFilesSync } from '@graphql-tools/load-files';
import { createModule } from 'graphql-modules';
import { encodeId } from '../../loaders';

export const Entity = createModule({
  id: 'entity',
  typeDefs: loadFilesSync(resolvePackagePath('@frontside/backstage-plugin-graphql', 'src/app/modules/entity/entity.graphql')),
  resolvers: {
    Query: {
      entity: (
        _: any,
        { name, kind, namespace = 'default' }: { name: string; kind: string; namespace: string | undefined },
      ): { id: string } => ({ id: encodeId({ typename: 'Entity', name, kind, namespace }) }),
    },
  },
});
