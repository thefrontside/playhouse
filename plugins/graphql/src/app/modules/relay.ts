import { createModule, gql } from 'graphql-modules';

export const Relay = createModule({
  id: `relay`,
  typeDefs: gql`

interface Node {
  id: ID!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

type Query {
  node(id: ID!): Node
}
`,
  resolvers: {
    Query: {
      async node() {
        return { id: "Hello World", __typename: "Entity" };
      }
    },
  }
});
