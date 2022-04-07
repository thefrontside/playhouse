import { createModule, gql } from 'graphql-modules';
import { ResolverContext } from '../resolver-context';
import { kind } from '../resolvers';

export const Entity = createModule({
  id: 'entity',
  typeDefs: gql`
    interface Entity {
      name: String! #@field(at: "metadata.name")
      namespace: String #@field(at: "metadata.namespace")
      title: String #@field(at: "metadata.title")
      description: String #@field(at: "metadata.description")
      # labels?: Record<string, string>
      # annotations?: Record<string, string>
      tags: [String] #@field(at: "metadata.tags")
      links: [EntityLink] #@field(at: "metadata.links")
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
    Entity: {
      __resolveType: kind,
    },
    Query: {
      // eslint-disable-next-line @typescript-eslint/no-shadow
      async entity(_, { name, kind, namespace = 'default' }, { catalog }) {
        return catalog.getEntityByName({ name, kind, namespace });
      },
    },
  } as EntityResolvers,
});

interface EntityResolvers {
  Query: {
    entity(
      object: any,
      args: { name: string; kind: string; namespace: string | undefined },
      context: ResolverContext,
    ): Promise<any>;
  };
}
