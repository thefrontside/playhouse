import { createModule, gql } from 'graphql-modules';
import { encodeId } from '../loaders';

export const Entity = createModule({
  id: 'entity',
  typeDefs: gql`
    interface Entity {
      name: String! @field(at: "metadata.name")
      namespace: String @field(at: "metadata.namespace")
      title: String @field(at: "metadata.title")
      description: String @field(at: "metadata.description")
      tags: [String] @field(at: "metadata.tags")
      links: [EntityLink] @field(at: "metadata.links")
    }

    type EntityLink {
      url: String!
      title: String
      icon: String
    }

    extend type Query {
      entity(kind: String!, name: String!, namespace: String): Entity
    }
  `,
  resolvers: {
    Query: {
      entity: (
        _: any,
        { name, kind, namespace = 'default' }: { name: string; kind: string; namespace: string | undefined },
      ): { id: string } => ({ id: encodeId({ typename: 'Entity', name, kind, namespace }) }),
    },
  },
});
