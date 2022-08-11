import { createModule, gql } from 'graphql-modules'

export const myModule = createModule({
  id: 'my-module',
  dirname: __dirname,
  typeDefs: [
    gql`
      type Query {
        hello: String!
      }
    `
  ],
  resolvers: {
    Query: {
      hello: () => 'world'
    }
  }
})