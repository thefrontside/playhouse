import { Entity, GroupEntity, UserEntity } from '@backstage/catalog-model';
import { createModule, gql } from 'graphql-modules';
import { pascalCase } from 'pascal-case'
import { resolverProvider } from '../resolver';
import { ResolverContext } from '../resolver-context';

export const User = createModule({
  id: `user`,
  typeDefs: gql`
    union Owner = User | Team | SubDepartment | Department | Organization
    # union Ownable = System | Resource | Component | API | Domain | Template
    union Ownable = System | Resource | Website | Service | Library | Domain

    interface Group {
      children: [Group]! #@field(at: "spec.children")
      displayName: String @field(at: "spec.profile.displayName")
      email: String @field(at: "spec.profile.email")
      picture: String @field(at: "spec.profile.picture")
      parent: Group @hasOne(type: "childOf")
      members: [User] #@field(at: "spec.members")
      owns: [Ownable]
    }

    type Team implements Node & Entity & Group {
      id: ID!

      name: String!
      namespace: String
      title: String
      description: String
      tags: [String]
      links: [EntityLink]

      children: [Group]!
      displayName: String
      email: String
      picture: String
      parent: SubDepartment
      members: [User]
      owns: [Ownable]
    }

    type SubDepartment implements Node & Entity & Group {
      id: ID!

      name: String!
      namespace: String
      title: String
      description: String
      tags: [String]
      links: [EntityLink]

      children: [Group]!
      displayName: String
      email: String
      picture: String
      parent: Department
      members: [User]
      owns: [Ownable]
    }

    type Department implements Node & Entity & Group {
      id: ID!

      name: String!
      namespace: String
      title: String
      description: String
      tags: [String]
      links: [EntityLink]

      children: [Group]!
      displayName: String
      email: String
      picture: String
      parent: Organization
      members: [User]
      owns: [Ownable]
    }

    type Organization implements Node & Entity & Group {
      id: ID!

      name: String!
      namespace: String
      title: String
      description: String
      tags: [String]
      links: [EntityLink]

      children: [Group]!
      displayName: String
      email: String
      picture: String
      parent: Group
      members: [User]
      owns: [Ownable]
    }

    type User implements Node & Entity {
      id: ID!
      name: String!
      namespace: String
      title: String
      description: String
      tags: [String]
      links: [EntityLink]

      memberOf: [Group]! #@field(at: "spec.memberOf")
      displayName: String @field(at: "spec.profile.displayName")
      email: String @field(at: "spec.profile.email")
      picture: String @field(at: "spec.profile.picture")
      owns: [Ownable]
    }
  `,
  resolvers: {
    Owner: {
      __resolveType: async ({ id }: { id: string }, { loader }: ResolverContext): Promise<string | null> => {
        const entity = await loader.load(id);
        return (entity ? entity.__typeName : 'Unknown') ?? null;
      }
    }
    // TODO Ownable
  },
  providers: [
    resolverProvider({
      accept: (entity: Entity): entity is GroupEntity => entity.kind === 'Group',
      resolve: entity => entity ? ({ __typeName: pascalCase(entity.spec.type), ...entity }) : null,
    }),
    resolverProvider({
      accept: (entity: Entity): entity is UserEntity => entity.kind === 'User',
      resolve: entity => entity ? ({ __typeName: 'User', ...entity }) : null,
    }),
  ],
});
