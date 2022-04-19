import { createModule, gql } from "graphql-modules";

export const Shared = createModule({
  id: 'shared',
  typeDefs: gql`
    enum Lifecycle {
      EXPERIMENTAL
      PRODUCTION
      DEPRECATED
    }

    type Never implements Node {
      id: ID!
    }
  `,
})
