import { createModule } from 'graphql-modules';
import { relationDirectiveMapper } from '../relationDirectiveMapper';
import { GraphQLModule } from '@frontside/hydraphql';
import { loadFilesSync } from '@graphql-tools/load-files';
import { resolvePackagePath } from '@backstage/backend-common';

const relationSchemaPath = resolvePackagePath(
  '@frontside/backstage-plugin-graphql-backend-module-catalog',
  'src/relation/relation.graphql',
);

/** @public */
export const Relation = (): GraphQLModule => ({
  mappers: { relation: relationDirectiveMapper },
  module: createModule({
    id: 'relation',
    typeDefs: loadFilesSync(relationSchemaPath),
  })
});
