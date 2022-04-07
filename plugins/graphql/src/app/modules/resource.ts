import { createModule, gql } from 'graphql-modules';

export const Resource = createModule({
  id: `resource`,
  typeDefs: gql`
    type Resource implements Node & Entity {
      id: ID!
      name: String!
      namespace: String
      title: String
      description: String
      tags: [String]
      links: [EntityLink]

      type: String! #@field(at: "spec.type")
      owner: Owner! #@field(at: "spec.owner")
      dependencyOf: [Component]
      system: System #@field(at: "spec.system")
    }
  `,
});
