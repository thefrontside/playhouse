import { Entity } from '@backstage/catalog-model';
import { createModule, gql } from 'graphql-modules';
import { entityToNode, Node as EntityNode } from '../mappers';
import { ResolverContext } from '../resolver-context';

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
  resolvers: {
    Query: {
      // eslint-disable-next-line @typescript-eslint/no-shadow
      node: async (_, { id }, { loader }) => loader.load(id),
    },
  } as NodeResolvers,
  providers: [
    entityToNode<Entity, EntityNode>({
      accept: (entity): entity is Entity => 'kind' in entity,
      toNode(entity) {
        return {
          __typename: entity.kind,
          ...entity
        }
      }
    }),
  ],
});

interface NodeResolvers {
  Query: {
    node(
      object: any,
      args: { id: string },
      context: ResolverContext,
    ): Promise<any>;
  };
}
