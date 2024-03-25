import { createModule } from 'graphql-modules';
import { loadFilesSync } from '@graphql-tools/load-files';
import { resolvePackagePath } from '@backstage/backend-common';
import { GraphQLModule } from '@frontside/hydraphql';
import { Common } from '../common';

const relationSchemaPath = resolvePackagePath(
  '@frontside/backstage-plugin-graphql-backend-module-catalog',
  'src/relation/relation.graphql',
);

/** @public */
export const Relation = (): GraphQLModule => ({
  mappers: { ...Common().mappers },
  postTransform: Common().postTransform,
  module: createModule({
    id: 'catalog-relation',
    typeDefs: [...Common().module.typeDefs, ...loadFilesSync(relationSchemaPath)],
    resolvers: {
      ...Common().module.config.resolvers,
    }
  })
});
