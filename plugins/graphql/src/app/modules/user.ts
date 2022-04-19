import { Entity, GroupEntity, UserEntity } from '@backstage/catalog-model';
import { createModule, gql } from 'graphql-modules';
import { pascalCase } from 'pascal-case'
import { resolverProvider } from '../resolver';

export const User = createModule({
  id: `user`,
  typeDefs: gql`
    union Owner = User | Team | SubDepartment | Department | Organization

    interface Group {
      children: [Group]! @relation(type: "parentOf")
      displayName: String @field(at: "spec.profile.displayName")
      email: String @field(at: "spec.profile.email")
      picture: String @field(at: "spec.profile.picture")
      parent: Group @relation(type: "childOf")
      members: [User] @relation(type: "hasMember")
      ownerOf: [Ownable] @relation
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
      ownerOf: [Ownable]
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
      ownerOf: [Ownable]
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
      ownerOf: [Ownable]
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
      ownerOf: [Ownable]
    }

    type User implements Node & Entity {
      id: ID!
      name: String!
      namespace: String
      title: String
      description: String
      tags: [String]
      links: [EntityLink]

      memberOf: [Group]! @relation
      displayName: String @field(at: "spec.profile.displayName")
      email: String @field(at: "spec.profile.email")
      picture: String @field(at: "spec.profile.picture")
      ownerOf: [Ownable] @relation
    }
  `,
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
