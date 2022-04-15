import { Entity, LocationEntity } from "@backstage/catalog-model";
import { createModule, gql } from "graphql-modules";
import { resolverProvider } from "../resolver";

export const Location = createModule({
  id: 'location',
  typeDefs: gql`
    type Location implements Node & Entity {
      id: ID!

      name: String!
      namespace: String
      title: String
      description: String
      labels: [KeyValuePair]
      annotations: [KeyValuePair]
      tags: [String!]
      links: [EntityLink!]

      type: String @field(at: "spec.type")
      target: String @field(at: "spec.target")
      targets: [String] @field(at: "spec.targets")
    }
  `,
  providers: [
    resolverProvider({
      accept: (entity: Entity): entity is LocationEntity => entity.kind === 'Location',
      resolve: entity => entity ? ({ __typeName: 'Location', ...entity }) : null,
    }),
  ],
})
