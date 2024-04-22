import { TypeDefs, createModule } from 'graphql-modules';
import { loadFilesSync } from '@graphql-tools/load-files';
import { resolvePackagePath } from '@backstage/backend-common';
import { Relation } from '../relation';
import { GraphQLModule } from '@frontside/hydraphql';
import { EntityRelation, parseEntityRef } from '@backstage/catalog-model';

const catalogSchemaPath = resolvePackagePath(
  '@frontside/backstage-plugin-graphql-backend-module-catalog',
  'src/catalog/catalog.graphql',
);

/** @public */
export const Catalog = ({ typeDefs }: { typeDefs?: TypeDefs } = {}): GraphQLModule => ({
  mappers: { ...Relation().mappers },
  postTransform: Relation().postTransform,
  module: createModule({
    id: 'catalog-entities',
    typeDefs: [
      ...Relation().module.typeDefs,
      ...typeDefs ? [typeDefs].flat() : loadFilesSync(catalogSchemaPath),
    ],
    resolvers: {
      ...Relation().module.config.resolvers,
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
      Relation: {
        targetRef: (relation: EntityRelation) => parseEntityRef(relation.targetRef),
      },
    },
  }),
});
