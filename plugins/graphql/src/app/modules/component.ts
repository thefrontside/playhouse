import { ComponentEntity, Entity } from '@backstage/catalog-model';
import { createModule, gql } from 'graphql-modules';
import { pascalCase } from 'pascal-case'
import { resolverProvider } from '../resolver';

export const Component = createModule({
  id: `component`,
  typeDefs: gql`
    union Ownable = Website | Service | Library
    union Dependency = Website | Service | Library

    interface Component {
      lifecycle: Lifecycle! @field(at: "spec.lifecycle")
      owner: Owner! @relation(type: "ownedBy")
      system: System @relation(type: "partOf", kind: "system")
      component: Component @relation(type: "partOf", kind: "component")
      subComponents: [Component] @relation(type: "hasPart")
      providesApi: [API] @relation
      consumesApi: [API] @relation
      dependencies: [Dependency] @relation(type: "dependsOn")
    }

    type Website implements Node & Entity & Component {
      id: ID!

      name: String!
      namespace: String
      title: String
      description: String
      tags: [String!]
      links: [EntityLink!]

      lifecycle: Lifecycle!
      owner: Owner!
      system: System
      component: Component
      subComponents: [Component]
      providesApi: [API]
      consumesApi: [API]
      dependencies: [Dependency]
    }

    type Service implements Node & Entity & Component {
      id: ID!

      name: String!
      namespace: String
      title: String
      description: String
      tags: [String!]
      links: [EntityLink!]

      lifecycle: Lifecycle!
      owner: Owner!
      system: System
      component: Component
      subComponents: [Component]
      providesApi: [API]
      consumesApi: [API]
      dependencies: [Dependency]
    }

    type Library implements Node & Entity & Component {
      id: ID!

      name: String!
      namespace: String
      title: String
      description: String
      tags: [String!]
      links: [EntityLink!]

      lifecycle: Lifecycle!
      owner: Owner!
      system: System
      component: Component
      subComponents: [Component]
      providesApi: [API]
      consumesApi: [API]
      dependencies: [Dependency]
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
