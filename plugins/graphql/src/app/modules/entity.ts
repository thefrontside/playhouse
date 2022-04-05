import { createModule, gql } from 'graphql-modules';
import { ResolverContext } from '../resolver-context';

export const Entity = createModule({
  id: `entity`,
  dirname: __dirname,
  typeDefs: gql`

type Entity implements Node {
  id: ID!
}

extend type Query {
  entity(kind: String! name: String! namespace: String): Entity
}
`,
  resolvers: {
    Query: {
      async entity(_, { name, kind, namespace = 'default'}, { catalog }) {
        return catalog.getEntityByName({ name, kind, namespace });
      }
    }
  } as EntityResolvers,
});

interface EntityResolvers {
  Query: {
    entity(object: any, args: { name: string, kind: string, namespace: string | undefined}, context: ResolverContext): Promise<any>;
  }
}
