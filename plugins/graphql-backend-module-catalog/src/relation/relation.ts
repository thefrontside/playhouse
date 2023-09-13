import { TypeDefs, createModule } from 'graphql-modules';
import { relationDirectiveMapper } from '../relationDirectiveMapper';
import { createDirectiveMapperProvider } from '@frontside/hydraphql';
import { loadFiles, loadFilesSync } from '@graphql-tools/load-files';
import { resolvePackagePath } from '@backstage/backend-common';

const relationSchemaPath = resolvePackagePath(
  '@frontside/backstage-plugin-graphql-backend-module-catalog',
  'src/relation/relation.graphql',
);

/** @public */
export const RelationSync = (
  typeDefs: TypeDefs = loadFilesSync(relationSchemaPath),
) =>
  createModule({
    id: 'relation',
    typeDefs,
    providers: [
      createDirectiveMapperProvider('relation', relationDirectiveMapper),
    ],
  });

/** @public */
export const Relation = async () =>
  RelationSync(await loadFiles(relationSchemaPath));
