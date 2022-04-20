import { resolvePackagePath } from "@backstage/backend-common";
import { Entity, LocationEntity } from "@backstage/catalog-model";
import { loadFilesSync } from "@graphql-tools/load-files";
import { createModule } from "graphql-modules";
import { resolverProvider } from "../resolver";

export const Location = createModule({
  id: 'location',
  typeDefs: loadFilesSync(resolvePackagePath('@internal/plugin-graphql', 'typedefs/location.graphql')),
  providers: [
    resolverProvider({
      accept: (entity: Entity): entity is LocationEntity => entity.kind === 'Location',
      resolve: entity => entity ? ({ __typeName: 'Location', ...entity }) : null,
    }),
  ],
})
