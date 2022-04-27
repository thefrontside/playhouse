import { resolvePackagePath } from '@backstage/backend-common';
import { loadFilesSync } from '@graphql-tools/load-files';
import { createModule } from 'graphql-modules';
import { encodeId } from '../../loaders';
import { EntityModule } from "./__generated__/types";

export const Entity = createModule({
  id: 'entity',
  typeDefs: loadFilesSync(resolvePackagePath('@internal/plugin-graphql', 'src/app/modules/entity/entity.graphql')),
  resolvers: {
    Query: {
      entity: (_, { kind, name, namespace }, { loader }) =>
        loader.load(encodeId({ kind, name, namespace: namespace ?? undefined }))
     },
  } as EntityModule.Resolvers,
});
