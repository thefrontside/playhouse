import { resolvePackagePath } from '@backstage/backend-common';
import { loadFilesSync } from '@graphql-tools/load-files';
import { createModule } from 'graphql-modules';
import { NodeModule } from "./__generated__/types";

export const Node = createModule({
  id: 'node',
  typeDefs: loadFilesSync(resolvePackagePath('@internal/plugin-graphql', 'src/app/modules/node/node.graphql')),
  resolvers: {
    Query: {
      node: (_, { id }, { loader }) => loader.load(id),
    },
  } as NodeModule.Resolvers,
});
