import { resolvePackagePath } from '@backstage/backend-common'
import { createModule, gql } from 'graphql-modules'

export const myModule = createModule({
  id: 'my-module',
  dirname: resolvePackagePath('backend', 'src/graphql'),
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
