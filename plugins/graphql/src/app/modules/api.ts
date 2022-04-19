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
      owner: Owner! @relation(type: "ownedBy")
      definition: String! @field(at: "spec.definition")
      system: System @relation(type: "partOf")
      consumers: [Component] @relation(type: "apiConsumedBy")
      providers: [Component] @relation(type: "apiProvidedBy")
    }

    type Openapi implements Node & Entity & API {
      id: ID!

      name: String!
      namespace: String
      title: String
      description: String
      tags: [String!]
      links: [EntityLink!]

      lifecycle: Lifecycle!
      owner: Owner!
      definition: String!
      system: System
      consumers: [Component]
      providers: [Component]
    }

    type Graphql implements Node & Entity & API {
      id: ID!

      name: String!
      namespace: String
      title: String
      description: String
      tags: [String!]
      links: [EntityLink!]

      lifecycle: Lifecycle!
      owner: Owner!
      definition: String!
      system: System
      consumers: [Component]
      providers: [Component]
    }

    type Asyncapi implements Node & Entity & API {
      id: ID!

      name: String!
      namespace: String
      title: String
      description: String
      tags: [String!]
      links: [EntityLink!]

      lifecycle: Lifecycle!
      owner: Owner!
      definition: String!
      system: System
      consumers: [Component]
      providers: [Component]
    }

    type Grpc implements Node & Entity & API {
      id: ID!

      name: String!
      namespace: String
      title: String
      description: String
      tags: [String!]
      links: [EntityLink!]

      lifecycle: Lifecycle!
      owner: Owner!
      definition: String!
      system: System
      consumers: [Component]
      providers: [Component]
    }
  `,
  providers: [
    resolverProvider({
      accept: (entity: Entity): entity is ApiEntity => entity.kind === 'API',
      resolve: entity => entity ? ({ __typeName: pascalCase(entity.spec.type), ...entity }) : null,
    }),
  ],
})
