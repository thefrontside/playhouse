import { Entity, ResourceEntity } from '@backstage/catalog-model';
import { createModule, gql } from 'graphql-modules';
import { pascalCase } from 'pascal-case'
import { resolverProvider } from '../resolver';

export const Resource = createModule({
  id: `resource`,
  typeDefs: gql`
    union Ownable = Database
    union SystemPart = Database
    union Dependency = Database

    interface Resource {
      ownedBy: Owner! @relation
      dependsOn: [Dependency] @relation
      dependencyOf: [Dependency] @relation
      partOf: [System] @relation
    }

    type Database implements Node & Entity & Resource {
      id: ID!

      name: String!
      namespace: String
      title: String
      description: String
      labels: [KeyValuePair]
      annotations: [KeyValuePair]
      tags: [String!]
      links: [EntityLink!]

      ownedBy: Owner!
      dependsOn: [Dependency]
      dependencyOf: [Dependency]
      partOf: [System]
    }
  `,
  providers: [
    resolverProvider({
      accept: (entity: Entity): entity is ResourceEntity => entity.kind === 'Resource',
      resolve: entity => entity ? ({ __typeName: pascalCase(entity.spec.type), ...entity }) : null,
    }),
  ],
});
