import { createModule, gql } from 'graphql-modules';

export const User = createModule({
  id: `user`,
  typeDefs: gql`
    union Owner = User | Group
    # union Ownable = System | Resource | Component | API | Domain | Template
    union Ownable = System | Resource | Component | Domain

    type Group implements Node & Entity {
      id: ID!
      name: String!
      namespace: String
      title: String
      description: String
      tags: [String]
      links: [EntityLink]

      type: String! #@field(at: "spec.type")
      children: [Group]! #@field(at: "spec.children")
      displayName: String #@field(at: "spec.profile.displayName")
      email: String #@field(at: "spec.profile.email")
      picture: String #@field(at: "spec.profile.picture")
      parent: Group #@field(at: "spec.parent")
      members: [User] #@field(at: "spec.members")
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
      displayName: String #@field(at: "spec.profile.displayName")
      email: String #@field(at: "spec.profile.email")
      picture: String #@field(at: "spec.profile.picture")
      owns: [Ownable]
    }

    extend type Query {
      owner(kind: String!, name: String!, namespace: String): Owner
    }
  `,
});
