import { resolvePackagePath } from '@backstage/backend-common';
import { loadFilesSync } from '@graphql-tools/load-files';
import { createModule } from 'graphql-modules';
import { encodeId } from '../loaders';
import { ResolverContext } from '../resolver-context';

export const Node = createModule({
  id: 'node',
  typeDefs: loadFilesSync(resolvePackagePath('@internal/plugin-graphql', 'typedefs/node.graphql')),
  resolvers: {
    Node: {
      id: async ({ id }: { id: string }, _: never, { loader }: ResolverContext): Promise<string | null> => {
        const entity = await loader.load(id);
        if (!entity) return null;
        const { __typeName, kind, metadata: { namespace = 'default', name } } = entity;
        return encodeId({ typename: __typeName, kind, name, namespace });
      },
    },
    Query: {
      node: (_: any, { id }: { id: string }): { id: string } => ({ id }),
    },
  },
});
