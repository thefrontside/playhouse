import { createModule, gql } from 'graphql-modules';

export const Domain = createModule({
  id: `domain`,
  typeDefs: gql`
    type Domain implements Node & Entity {
      id: ID!
      name: String!
      namespace: String
      title: String
      description: String
      tags: [String]
      links: [EntityLink]

      owner: Owner! #@field(at: "spec.owner")
    }
  `,
});
