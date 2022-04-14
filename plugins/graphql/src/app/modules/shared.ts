import { createModule, gql } from "graphql-modules";

export const Shared = createModule({
  id: 'shared',
  typeDefs: gql`
    enum Lifecycle {
      EXPERIMENTAL
      PRODUCTION
      DEPRECATED
    }

    type KeyValuePair {
      key: String!
      value: String!
    }
  `,
})
