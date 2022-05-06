import { resolvePackagePath } from "@backstage/backend-common";
import { createModule } from "graphql-modules";
import { loadFilesSync } from '@graphql-tools/load-files'
import GraphQLJSON, { GraphQLJSONObject } from "graphql-type-json";

export const Catalog = createModule({
  id: 'Catalog',
  typeDefs: loadFilesSync(resolvePackagePath('@frontside/backstage-plugin-graphql', 'src/app/modules/catalog/catalog.graphql')),
  resolvers: {
    JSON: GraphQLJSON,
    JSONObject: GraphQLJSONObject,
  },
})
