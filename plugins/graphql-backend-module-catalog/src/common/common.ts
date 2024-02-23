import { createModule } from 'graphql-modules';
import { relationDirectiveMapper } from '../relationDirectiveMapper';
import { GraphQLModule } from '@frontside/hydraphql';
import { loadFilesSync } from '@graphql-tools/load-files';
import { resolvePackagePath } from '@backstage/backend-common';
import { queryResolvers } from '../resolvers';
import GraphQLJSON, { GraphQLJSONObject } from 'graphql-type-json';
import { generateEntitiesQueryInputTypes } from '../generateInputTypes';

const commonSchemaPath = resolvePackagePath(
  '@frontside/backstage-plugin-graphql-backend-module-catalog',
  'src/common/common.graphql',
);

/** @public */
export const Common = (): GraphQLModule => ({
  mappers: { relation: relationDirectiveMapper },
  postTransform: generateEntitiesQueryInputTypes,
  module: createModule({
    id: 'catalog-common',
    typeDefs: loadFilesSync(commonSchemaPath),
    resolvers: {
      JSON: GraphQLJSON,
      JSONObject: GraphQLJSONObject,
      Query: queryResolvers()
    }
  })
});
