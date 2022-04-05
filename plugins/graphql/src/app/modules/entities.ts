import { createModule, gql } from 'graphql-modules';

export const Entities = createModule({
  id: `entities`,
  typeDefs: gql`

type Entity implements Node {
  id: ID!
}

extend type Query {
  entity(kind: String! name: String! namespace: String): Entity
}
`,
});
