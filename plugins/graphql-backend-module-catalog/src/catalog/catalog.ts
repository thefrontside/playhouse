import { createModule } from 'graphql-modules';
import GraphQLJSON, { GraphQLJSONObject } from 'graphql-type-json';
import { relationDirectiveMapper } from '../relationDirectiveMapper';
import {
  GraphQLModule,
  encodeId,
} from '@frontside/hydraphql';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { loadFilesSync } from '@graphql-tools/load-files';
import { resolvePackagePath } from '@backstage/backend-common';
import { CATALOG_SOURCE } from '../constants';

const catalogSchemaPath = resolvePackagePath(
  '@frontside/backstage-plugin-graphql-backend-module-catalog',
  'src/catalog/catalog.graphql',
);

/** @public */
export const Catalog = (): GraphQLModule => ({
  mappers: { relation: relationDirectiveMapper },
  module: createModule({
    id: 'catalog',
    typeDefs: loadFilesSync(catalogSchemaPath),
    resolvers: {
      JSON: GraphQLJSON,
      JSONObject: GraphQLJSONObject,
      Entity: {
        labels: (labels: Record<string, string>) =>
          labels
            ? Object.entries(labels).map(([key, value]) => ({ key, value }))
            : null,
        annotations: (annotations: Record<string, string>) =>
          annotations
            ? Object.entries(annotations).map(([key, value]) => ({
                key,
                value,
              }))
            : null,
      },
      Query: {
        entity: (
          _: any,
          {
            name,
            kind,
            namespace = 'default',
          }: { name: string; kind: string; namespace: string },
        ): { id: string } => ({
          id: encodeId({
            source: CATALOG_SOURCE,
            typename: 'Entity',
            query: { ref: stringifyEntityRef({ name, kind, namespace }) },
          }),
        }),
      },
    },
  })
});
