import { resolvePackagePath } from "@backstage/backend-common";
import { loadFilesSync } from "@graphql-tools/load-files";
import { createModule } from "graphql-modules";

export const Location = createModule({
  id: 'location',
  typeDefs: loadFilesSync(resolvePackagePath('@internal/plugin-graphql', 'src/app/modules/location/location.graphql')),
})
