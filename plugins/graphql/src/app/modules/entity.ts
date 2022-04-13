import { createModule, gql } from 'graphql-modules';
import { encodeId } from '../loaders';
import { ResolverContext } from '../resolver-context';

interface EntityResolvers {
  Entity: {
    __resolveType(
      entity: { id: string },
      context: ResolverContext,
    ): Promise<string | null>;
  };
  Query: {
    entity(
      object: any,
      args: { name: string; kind: string; namespace: string | undefined },
      context: ResolverContext,
    ): { id: string };
  };
}

export const resolvers: EntityResolvers = {
  Entity: {
    __resolveType: async ({ id }, { loader }) => {
      const entity = await loader.load(id);
      return (entity ? entity.__typeName : 'Unknown') ?? null;
    }
  },
  Query: {
    entity: (_, { name, kind, namespace = 'default' }) => ({ id: encodeId({ typename: 'Entity', name, kind, namespace }) })
  },
};

export const Entity = createModule({
  id: 'entity',
  typeDefs: gql`
    interface Entity {
      id: ID!
      name: String! @field(at: "metadata.name")
      namespace: String @field(at: "metadata.namespace")
      title: String @field(at: "metadata.title")
      description: String @field(at: "metadata.description")
      # labels?: Record<string, string>
      # annotations?: Record<string, string>
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
  resolvers,
});
