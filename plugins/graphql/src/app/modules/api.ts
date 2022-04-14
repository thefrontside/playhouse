import { ApiEntity, Entity } from "@backstage/catalog-model";
import { createModule, gql } from "graphql-modules";
import { pascalCase } from 'pascal-case'
import { resolverProvider } from "../resolver";

export const API = createModule({
  id: 'API',
  typeDefs: gql`
    union Ownable = Openapi | Graphql | Asyncapi | Grpc

    interface API {
      lifecycle: Lifecycle! @field(at: "spec.lifecycle")
      ownedBy: Owner! @relation
      definition: String! @field(at: "spec.definition")
      partOf: System @relation
      apiConsumedBy: [Component] @relation
      apiProvidedBy: [Component] @relation
    }

    type Openapi implements Node & Entity & API {
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
      definition: String!
      partOf: System
      apiConsumedBy: [Component]
      apiProvidedBy: [Component]
    }

    type Graphql implements Node & Entity & API {
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
      definition: String!
      partOf: System
      apiConsumedBy: [Component]
      apiProvidedBy: [Component]
    }

    type Asyncapi implements Node & Entity & API {
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
      definition: String!
      partOf: System
      apiConsumedBy: [Component]
      apiProvidedBy: [Component]
    }

    type Grpc implements Node & Entity & API {
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
      definition: String!
      partOf: System
      apiConsumedBy: [Component]
      apiProvidedBy: [Component]
    }
  `,
  providers: [
    resolverProvider({
      accept: (entity: Entity): entity is ApiEntity => entity.kind === 'API',
      resolve: entity => entity ? ({ __typeName: pascalCase(entity.spec.type), ...entity }) : null,
    }),
  ],
})
