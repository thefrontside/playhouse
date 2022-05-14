import { resolvePackagePath } from "@backstage/backend-common";
import { CompoundEntityRef, stringifyEntityRef } from '@backstage/catalog-model';
import { createModule } from "graphql-modules";
import { loadFilesSync } from '@graphql-tools/load-files'
import GraphQLJSON, { GraphQLJSONObject } from "graphql-type-json";
import { resolveType } from "../../resolver";

export const Catalog = createModule({
  id: 'catalog',
  typeDefs: loadFilesSync(resolvePackagePath('@frontside/backstage-plugin-graphql', 'src/app/modules/catalog/catalog.graphql')),
  resolvers: {
    Entity: { __resolveType: resolveType },
    Owner: { __resolveType: resolveType },
    Ownable: { __resolveType: resolveType },
    Dependency: { __resolveType: resolveType },
    Lifecycle: {
      EXPERIMENTAL: 'experimental',
      PRODUCTION: 'production',
      DEPRECATED: 'deprecated',
    },
    JSON: GraphQLJSON,
    JSONObject: GraphQLJSONObject,
    Query: {
      entity: (
        _: any,
        { name, kind, namespace = 'default' }: CompoundEntityRef,
      ): { id: string } => ({ id: stringifyEntityRef({ name, kind, namespace }) }),
    }
  },
})
