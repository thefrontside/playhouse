import { resolvePackagePath } from '@backstage/backend-common';
import { loadFilesSync } from '@graphql-tools/load-files';
import { createModule } from 'graphql-modules';
import { ResolverContext } from '../../resolver-context';

export const Node = createModule({
  id: 'node',
  typeDefs: loadFilesSync(resolvePackagePath('@frontside/backstage-plugin-graphql', 'src/app/modules/node/node.graphql')),
  resolvers: {
    Node: {
      id: async ({ id }: { id: string }, _: never, { loader }: ResolverContext): Promise<string | null> => {
        const entity = await loader.load(id);
        if (!entity) return null;
        return id;
      },
    },
    Query: {
      node: (_: any, { id }: { id: string }): { id: string } => ({ id }),
    },
  },
});
