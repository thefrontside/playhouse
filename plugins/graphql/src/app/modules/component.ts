import { ComponentEntity, Entity } from '@backstage/catalog-model';
import { createModule, gql } from 'graphql-modules';
import { pascalCase } from 'pascal-case'
import { resolverProvider } from '../resolver';

export const Component = createModule({
  id: `component`,
  typeDefs: gql`
    enum Lifecycle {
      EXPERIMENTAL
      PRODUCTION
      DEPRECATED
    }

    interface Component {
      lifecycle: Lifecycle! @field(at: "spec.lifecycle")
      owner: Owner! @hasOne(type: "ownedBy")
      subcomponentOf: Component @hasOne(type: "partOf")
      components: [Component] # Use ComponentConnection
      # providesApis: [API] #@field(at: "spec.providesApis")
      # consumesApis: [API] #@field(at: "spec.consumesApis")
      dependencies: [Resource] #@field(at: "spec.dependsOn")
      system: System #@field(at: "spec.system")
    }

    type Website implements Node & Entity & Component {
      id: ID!

      name: String!
      namespace: String
      title: String
      description: String
      tags: [String!]
      links: [EntityLink!]

      lifecycle: Lifecycle!
      owner: Owner!
      subcomponentOf: Component
      components: [Component]
      # providesApis: [API]
      # consumesApis: [API]
      dependencies: [Resource]
      system: System
    }

    type Service implements Node & Entity & Component {
      id: ID!

      name: String!
      namespace: String
      title: String
      description: String
      tags: [String!]
      links: [EntityLink!]

      lifecycle: Lifecycle!
      owner: Owner!
      subcomponentOf: Component
      components: [Component]
      # providesApis: [API]
      # consumesApis: [API]
      dependencies: [Resource]
      system: System
    }

    type Library implements Node & Entity & Component {
      id: ID!

      name: String!
      namespace: String
      title: String
      description: String
      tags: [String!]
      links: [EntityLink!]

      lifecycle: Lifecycle!
      owner: Owner!
      subcomponentOf: Component
      components: [Component]
      # providesApis: [API]
      # consumesApis: [API]
      dependencies: [Resource]
      system: System
    }

    # service, library
  `,
  resolvers: {
    Lifecycle: {
      EXPERIMENTAL: 'experimental',
      PRODUCTION: 'production',
      DEPRECATED: 'deprecated',
    },
    // Component: {
    //   __resolveType: async ({ id }: { id: string }, { loader }: ResolverContext): Promise<string | null> => {
    //     const entity = await loader.load(id);
    //     return (entity ? entity.__typeName : 'Unknown') ?? null;
    //   }
    // }
  },
  providers: [
    resolverProvider({
      accept: (entity: Entity): entity is ComponentEntity => entity.kind === 'Component',
      resolve: entity => entity ? ({ __typeName: pascalCase(entity.spec.type), ...entity }) : null,
    }),
  ],
});
