import { resolvePackagePath } from "@backstage/backend-common";
import { createModule } from "graphql-modules";
import { loadFilesSync } from '@graphql-tools/load-files'

export const API = createModule({
  id: 'API',
  typeDefs: loadFilesSync(resolvePackagePath('@internal/plugin-graphql', 'src/app/modules/api/api.graphql')),
})
