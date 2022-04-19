import { Entity, ResourceEntity } from '@backstage/catalog-model';
import { createModule, gql } from 'graphql-modules';
import { pascalCase } from 'pascal-case'
import { resolverProvider } from '../resolver';

export const Resource = createModule({
  id: `resource`,
  typeDefs: gql`
    union Ownable = Database
    union Dependency = Database

    interface Resource {
      owner: Owner! @relation(type: "ownedBy")
      dependencies: [Dependency] @relation(type: "dependsOn")
      dependents: [Dependency] @relation(type: "dependencyOf")
      systems: [System] @relation(type: "partOf")
    }

    type Database implements Node & Entity & Resource {
      id: ID!

      name: String!
      namespace: String
      title: String
      description: String
      tags: [String!]
      links: [EntityLink!]

      owner: Owner!
      dependencies: [Dependency]
      dependents: [Dependency]
      systems: [System]
    }
  `,
  providers: [
    resolverProvider({
      accept: (entity: Entity): entity is ResourceEntity => entity.kind === 'Resource',
      resolve: entity => entity ? ({ __typeName: pascalCase(entity.spec.type), ...entity }) : null,
    }),
  ],
});
