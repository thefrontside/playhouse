import { resolvePackagePath } from "@backstage/backend-common";
import { loadFilesSync } from "@graphql-tools/load-files";
import { createModule } from "graphql-modules";
import GraphQLJSON, { GraphQLJSONObject } from 'graphql-type-json';

export const Template = createModule({
  id: 'Template',
  typeDefs: loadFilesSync(resolvePackagePath('@internal/plugin-graphql', 'src/app/modules/template/template.graphql')),
  resolvers: {
    JSON: GraphQLJSON,
    JSONObject: GraphQLJSONObject,
  },
})
