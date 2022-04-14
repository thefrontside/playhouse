import { ComponentEntity, Entity } from '@backstage/catalog-model';
import { createModule, gql } from 'graphql-modules';
import { pascalCase } from 'pascal-case'
import { resolverProvider } from '../resolver';

export const Component = createModule({
  id: `component`,
  typeDefs: gql`
    union Module = Website | Service | Library
    union SystemPart = Website | Service | Library
    union Ownable = Website | Service | Library
    union Dependency = Website | Service | Library

    interface Component {
      lifecycle: Lifecycle! @field(at: "spec.lifecycle")
      ownedBy: Owner! @relation
      partOf: Module @relation
      hasPart: [Component] @relation
      providesApi: [API] @relation
      consumesApi: [API] @relation
      dependsOn: [Dependency] @relation
    }

    type Website implements Node & Entity & Component {
      id: ID!

      name: String!
      namespace: String
      title: String
      description: String
      labels: [KeyValuePair]
      annotations: [KeyValuePair]
      tags: [String!]
      links: [EntityLink!]

      lifecycle: Lifecycle!
      ownedBy: Owner!
      partOf: Module
      hasPart: [Component]
      providesApi: [API]
      consumesApi: [API]
      dependsOn: [Dependency]
    }

    type Service implements Node & Entity & Component {
      id: ID!

      name: String!
      namespace: String
      title: String
      description: String
      labels: [KeyValuePair]
      annotations: [KeyValuePair]
      tags: [String!]
      links: [EntityLink!]

      lifecycle: Lifecycle!
      ownedBy: Owner!
      partOf: Module
      hasPart: [Component]
      providesApi: [API]
      consumesApi: [API]
      dependsOn: [Dependency]
    }

    type Library implements Node & Entity & Component {
      id: ID!

      name: String!
      namespace: String
      title: String
      description: String
      labels: [KeyValuePair]
      annotations: [KeyValuePair]
      tags: [String!]
      links: [EntityLink!]

      lifecycle: Lifecycle!
      ownedBy: Owner!
      partOf: Module
      hasPart: [Component]
      providesApi: [API]
      consumesApi: [API]
      dependsOn: [Dependency]
    }
  `,
  resolvers: {
    Lifecycle: {
      EXPERIMENTAL: 'experimental',
      PRODUCTION: 'production',
      DEPRECATED: 'deprecated',
    },
  },
  providers: [
    resolverProvider({
      accept: (entity: Entity): entity is ComponentEntity => entity.kind === 'Component',
      resolve: entity => entity ? ({ __typeName: pascalCase(entity.spec.type), ...entity }) : null,
    }),
  ],
});
