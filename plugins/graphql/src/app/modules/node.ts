import { createModule, gql } from 'graphql-modules';
import { encodeId } from '../loaders';
import { ResolverContext } from '../resolver-context';

interface NodeResolvers {
  Node: {
    __resolveType(
      entity: { id: string },
      context: ResolverContext,
    ): Promise<string>;
    id(
      entity: { id: string },
      args: never,
      context: ResolverContext,
    ): Promise<string | null>;
  };
  Query: {
    node(
      entity: { id: string },
      args: { id: string },
      context: ResolverContext,
    ): typeof args;
  };
}

export const resolvers: NodeResolvers = {
  Node: {
    __resolveType: async ({ id }, { loader }) => {
      const entity = await loader.load(id);
      return entity ? entity.__typeName : 'Unknown';
    },
    id: async ({ id }, _, { loader }) => {
      const entity = await loader.load(id);
      if (!entity) return null;
      const { __typeName, kind, metadata: { namespace = 'default', name } } = entity;
      return encodeId({ typename: __typeName, kind, name, namespace });
    },
  },
  Query: {
    node: (_, { id }) => ({ id }),
  },
};

export const Node = createModule({
  id: 'node',
  typeDefs: gql`
    interface Node {
      id: ID!
    }

    type Query {
      node(id: ID!): Node
    }
  `,
  resolvers,
});
