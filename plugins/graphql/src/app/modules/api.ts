import { resolvePackagePath } from "@backstage/backend-common";
import { ApiEntity, Entity } from "@backstage/catalog-model";
import { createModule } from "graphql-modules";
import { loadFilesSync } from '@graphql-tools/load-files'
import { pascalCase } from 'pascal-case'
import { resolverProvider } from "../resolver";

export const API = createModule({
  id: 'API',
  typeDefs: loadFilesSync(resolvePackagePath('@internal/plugin-graphql', 'typedefs/api.graphql')),
  providers: [
    resolverProvider({
      accept: (entity: Entity): entity is ApiEntity => entity.kind === 'API',
      resolve: entity => entity ? ({ __typeName: pascalCase(entity.spec.type), ...entity }) : null,
    }),
  ],
})
