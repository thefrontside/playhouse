import { resolvePackagePath } from "@backstage/backend-common";
import { Entity, TemplateEntityV1beta2 } from "@backstage/catalog-model";
import { loadFilesSync } from "@graphql-tools/load-files";
import { createModule } from "graphql-modules";
import GraphQLJSON, { GraphQLJSONObject } from 'graphql-type-json';
import { pascalCase } from 'pascal-case'
import { resolverProvider } from "../resolver";

export const Template = createModule({
  id: 'Template',
  typeDefs: loadFilesSync(resolvePackagePath('@internal/plugin-graphql', 'typedefs/template.graphql')),
  resolvers: {
    JSON: GraphQLJSON,
    JSONObject: GraphQLJSONObject,
  },
  providers: [
    resolverProvider({
      accept: (entity: Entity): entity is TemplateEntityV1beta2 => entity.kind === 'Template',
      resolve: entity => entity ? ({ __typeName: pascalCase(entity.spec.type), ...entity }) : null,
    }),
  ],
})
