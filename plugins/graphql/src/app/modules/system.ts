import { createModule, gql } from 'graphql-modules';

export const System = createModule({
  id: `system`,
  typeDefs: gql`
    type System implements Node & Entity {
      id: ID!
      name: String!
      namespace: String
      title: String
      description: String
      tags: [String]
      links: [EntityLink]

      owner: Owner! #@field(at: "spec.owner")
      domain: Domain #@field(at: "spec.domain")
      components: [Component]
      resources: [Resource]
    }
  `,
});
