/* eslint-disable func-names */
/* eslint-disable jest/no-standalone-expect */

import { describe, it } from '@effection/jest';
import { loadFilesSync } from '@graphql-tools/load-files';
import { mergeTypeDefs } from '@graphql-tools/merge';
import DataLoader from 'dataloader';
import { buildASTSchema, DocumentNode, GraphQLNamedType, printType, validateSchema } from 'graphql';
import { createModule, gql } from 'graphql-modules';
import { transformDirectives } from '../app/mappers';
import { createGraphQLTestApp } from './setupTests';

describe('Transformer', () => {
  const graphqlHeader = loadFilesSync(require.resolve('../app/modules/core/core.graphql'));
  const transformSchema = (source: DocumentNode) => {
    const schema = (
    transformDirectives(
      buildASTSchema(
        mergeTypeDefs([source, graphqlHeader])
        )
      )
    )
    const errors = validateSchema(schema);
    if (errors.length > 0) {
      throw new Error(errors.map(e => e.message).join('\n'));
    }
    return schema
  }

  it('should add object type if empty @extend directive is used', function* () {
    const schema = transformSchema(gql`
    interface Entity @extend {
      totalCount: Int!
    }
    `)
    expect(printType(schema.getType('EntityImpl') as GraphQLNamedType).split('\n')).toEqual([
      'type EntityImpl implements Entity {',
      '  totalCount: Int!',
      '}'
    ]);
  })

  it('should merge fields from interface in @extend directive type', function* () {
    const schema = transformSchema(gql`
    interface Entity @extend(interface: "Node") {
      name: String!
    }
    `)
    expect(printType(schema.getType('Entity') as GraphQLNamedType).split('\n')).toEqual([
      'interface Entity implements Node {',
      '  id: ID!',
      '  name: String!',
      '}'
    ]);
  })

  it('should add object type with merged fields from interfaces', function* () {
    const schema = transformSchema(gql`
    interface Entity @extend(interface: "Node") {
      name: String!
    }
    `)
    expect(printType(schema.getType('EntityImpl') as GraphQLNamedType).split('\n')).toEqual([
      'type EntityImpl implements Entity & Node {',
      '  id: ID!',
      '  name: String!',
      '}'
    ]);
  })

  it('should merge fields for basic types', function* () {
    const schema = transformSchema(gql`
    interface Connection {
      foobar: String!
    }
    `)
    expect(printType(schema.getType('Connection') as GraphQLNamedType).split('\n')).toEqual([
      'interface Connection {',
      '  foobar: String!',
      '  pageInfo: PageInfo!',
      '  edges: [Edge!]!',
      '  count: Int',
      '}'
    ]);
  })

  it('should merge union types', function* () {
    const schema = transformSchema(gql`
    interface Component @extend {
      name: String!
    }
    interface Resource @extend {
      name: String!
    }

    union Entity = Component

    extend union Entity = Resource
    `)
    expect(printType(schema.getType('Entity') as GraphQLNamedType).split('\n')).toEqual([
      'union Entity = ComponentImpl | ResourceImpl'
    ]);
  })

  it('should add subtypes to a union type', function* () {
    const schema = transformSchema(gql`
    union Ownable = Entity

    interface Entity @extend {
      name: String!
    }
    interface Resource @extend(interface: "Entity") {
      location: String!
    }
    interface WebResource @extend(interface: "Resource", when: "spec.type", is: "website") {
      url: String!
    }
    interface User @extend {
      ownerOf: [Ownable!]! @relation
    }
    `)
    expect(printType(schema.getType('Ownable') as GraphQLNamedType).split('\n')).toEqual([
      'union Ownable = EntityImpl | ResourceImpl | WebResourceImpl'
    ]);
  })

  it('should extend a types sequence', function* () {
    const schema = transformSchema(gql`
    interface Entity @extend(interface: "Node") {
      name: String!
    }
    interface Resource @extend(interface: "Entity", when: "kind", is: "Resource") {
      location: String!
    }
    interface WebResource @extend(interface: "Resource", when: "spec.type", is: "website") {
      url: String!
    }
    interface ExampleCom @extend(interface: "WebResource", when: "spec.url", is: "example.com") {
      example: String!
    }
    `)
    expect(printType(schema.getType('ExampleCom') as GraphQLNamedType).split('\n')).toEqual([
      'interface ExampleCom implements WebResource & Resource & Entity & Node {',
      '  id: ID!',
      '  name: String!',
      '  location: String!',
      '  url: String!',
      '  example: String!',
      '}'
    ]);
  })

  it('should add arguments to the "Connection" type', function* () {
    const schema = transformSchema(gql`
    interface Group @extend(interface: "Node") {
      users: Connection @relation(type: "hasMember", interface: "User")
    }

    interface User @extend(interface: "Node", when: "kind", is: "User") {
      name: String!
    }
    `)
    expect(printType(schema.getType('Group') as GraphQLNamedType).split('\n')).toEqual([
      'interface Group implements Node {',
      '  id: ID!',
      '  users(first: Int, after: String, last: Int, before: String): UserConnection',
      '}'
    ]);
  })

  it('should override union type to interface if it has been used in a @relation directive with "Connection" type', function* () {
    const schema = transformSchema(gql`
    union Ownable = Entity

    interface Entity @extend(interface: "Node") {
      name: String!
    }
    interface Resource @extend(interface: "Entity", when: "kind", is: "Resource") {
      location: String!
    }
    interface User @extend {
      owns: Connection @relation(type: "ownerOf", interface: "Ownable")
    }
    `)
    expect(printType(schema.getType('Ownable') as GraphQLNamedType).split('\n')).toEqual([
      'interface Ownable implements Node {',
      '  id: ID!',
      '}'
    ]);
    expect(printType(schema.getType('Entity') as GraphQLNamedType).split('\n')).toEqual([
      'interface Entity implements Ownable & Node {',
      '  id: ID!',
      '  name: String!',
      '}'
    ]);
    expect(printType(schema.getType('Resource') as GraphQLNamedType).split('\n')).toEqual([
      'interface Resource implements Ownable & Entity & Node {',
      '  id: ID!',
      '  name: String!',
      '  location: String!',
      '}'
    ]);
    expect(printType(schema.getType('OwnableConnection') as GraphQLNamedType).split('\n')).toEqual([
      'type OwnableConnection implements Connection {',
      '  pageInfo: PageInfo!',
      '  edges: [OwnableEdge!]!',
      '  count: Int',
      '}'
    ]);
    expect(printType(schema.getType('User') as GraphQLNamedType).split('\n')).toEqual([
      'interface User {',
      '  owns(first: Int, after: String, last: Int, before: String): OwnableConnection',
      '}'
    ]);
  })

  it('should fail if `at` argument of @field is not a valid type', function* () {
    expect(() => transformSchema(gql`
    interface Entity @extend {
      name: String! @field(at: 42)
    }
    `)).toThrow('The "at" argument of @field directive must be a string or an array of strings');
  })

  it('should fail if `when` argument of @extend is not a valid type', function* () {
    expect(() => transformSchema(gql`
    interface Entity @extend(when: 42, is: "answer") {
      name: String!
    }
    `)).toThrow('The "when" argument of @extend directive must be a string or an array of strings');
  })

  it('should fail if `when` argument is used without `is` in @extend directive', function* () {
    expect(() => transformSchema(gql`
    interface Entity @extend(when: "kind") {
      name: String!
    }
    `)).toThrow('The @extend directive for "Entity" should have both "when" and "is" arguments or none of them');
  })

  it("should fail if @relation interface doesn't exist", function* () {
    expect(() => transformSchema(gql`
    interface Entity @extend {
      owners: Connection @relation(type: "ownedBy", interface: "Owner")
    }
    `)).toThrow('Error while processing directives on field "owners" of "Entity":\nThe interface "Owner" is not defined in the schema.');
  })

  it('should fail if @relation interface is input type', function* () {
    expect(() => transformSchema(gql`
    interface Entity @extend {
      owners: Connection @relation(type: "ownedBy", interface: "OwnerInput")
    }
    input OwnerInput {
      name: String!
    }
    `)).toThrow(`Error while processing directives on field "owners" of "Entity":\nThe interface "OwnerInput" is an input type and can't be used in a Connection.`);
  })

  it("should fail if @extend interface doesn't exist", function* () {
    expect(() => transformSchema(gql`
    interface Entity @extend(interface: "NonExistingInterface") {
      name: String!
    }
    `)).toThrow(`The interface "NonExistingInterface" described in @extend directive for "Entity" isn't abstract type or doesn't exist`);
  })

  it("should fail if @extend interface isn't an interface", function* () {
    expect(() => transformSchema(gql`
    interface Entity @extend(interface: "String") {
      name: String!
    }
    `)).toThrow(`The interface "String" described in @extend directive for "Entity" isn't abstract type or doesn't exist`);
  })

  it('should fail if @extend interface is already implemented by the type', function* () {
    expect(() => transformSchema(gql`
    interface Entity implements Node @extend(interface: "Node") {
      name: String!
    }
    `)).toThrow(`The interface "Node" described in @extend directive for "Entity" is already implemented by the type`);
  })

  it('should fail if Connection type is in a list', function* () {
    expect(() => transformSchema(gql`
    interface Entity @extend {
      owners: [Connection] @relation(type: "ownedBy", interface: "Owner")
    }
    interface Owner @extend {
      name: String!
    }
    `)).toThrow(`Error while processing directives on field "owners" of "Entity":\nIt's not possible to use a list of Connection type. Use either Connection type or list of specific type`);
  })

  it('should fail if Connection has arguments are not valid types', function* () {
    expect(() => transformSchema(gql`
    interface Entity @extend {
      owners(first: String!, after: Int!): Connection @relation(type: "ownedBy", interface: "Owner")
    }
    interface Owner @extend {
      name: String!
    }
    `)).toThrow(`Error while processing directives on field "owners" of "Entity":\nThe field has mandatory argument \"first\" with different type than expected. Expected: Int`);
  })

  it('should fail if @relation and @field are used on the same field', function* () {
    expect(() => transformSchema(gql`
    interface Entity @extend {
      owners: Connection @relation(type: "ownedBy", interface: "Owner") @field(at: "name")
    }
    interface Owner @extend {
      name: String!
    }
    `)).toThrow(`The field "owners" of "Entity" type has both @field and @relation directives at the same time`);
  })

  it('should fail if @extend without when/is is used more than once', function* () {
    expect(() => transformSchema(gql`
    interface Entity @extend(interface: "Node") {
      name: String!
    }
    interface Component @extend(interface: "Node") {
      name: String!
    }
    `)).toThrow(`The @extend directive of "Node" without "when" and "is" arguments could be used only once`);
  })

  it('should fail if subtype with required fields extends without when/is arguments from type without when/is arguments', function* () {
    const getSchema = () => transformSchema(gql`
    interface Entity @extend {
      name: String!
    }
    interface Resource @extend(interface: "Entity") {
      location: String!
    }
    interface WebResource @extend(interface: "Resource") {
      url: String!
    }
    `)
    expect(getSchema).toThrow(`The interface "WebResource" has required fields and can't be extended from "Resource" without "when" and "is" arguments, because "Resource" has already been extended without them`);
  })

  it('should add resolver for @field directive', function* () {
    const TestModule = createModule({
      id: 'test',
      typeDefs: gql`
      interface Entity @extend(interface: "Node") {
        first: String! @field(at: "metadata.name")
        second: String! @field(at: ["spec", "path.to.name"])
        third: String! @field(at: "nonexisting.path", default: "defaultValue")
      }
      `,
    })
    const entity = {
      metadata: { name: 'hello' },
      spec: { "path.to.name": 'world' }
    };
    const loader = () => new DataLoader(async () => [entity]);
    const query = createGraphQLTestApp(TestModule, loader)
    const result = yield query(/* GraphQL */`
      node(id: "test") { ...on Entity { first, second, third } }
    `)
    expect(result).toEqual({
      node: {
        first: 'hello',
        second: 'world',
        third: 'defaultValue',
      }
    })
  })

  it('should add resolver for @relation directive with single item', function* () {
    const TestModule = createModule({
      id: 'test',
      typeDefs: gql`
      interface Entity @extend(interface: "Node", when: "kind", is: "Entity") {
        ownedBy: User @relation
        owner: User @relation(type: "ownedBy")
        group: Group @relation(type: "ownedBy", kind: "Group")
      }
      interface User @extend(interface: "Node", when: "kind", is: "User") {
        name: String! @field(at: "name")
      }
      interface Group @extend(interface: "Node", when: "kind", is: "Group") {
        name: String! @field(at: "name")
      }
      `,
    })
    const entity = {
      kind: 'Entity',
      relations: [
        { type: 'ownedBy', targetRef: 'user:default/john' },
        { type: 'ownedBy', targetRef: 'group:default/team-a' }
      ]
    };
    const user = {
      kind: 'User',
      name: 'John'
    };
    const group = {
      kind: 'Group',
      name: 'Team A'
    };
    const loader = () => new DataLoader(async (ids) => ids.map(id => {
      if (id === 'user:default/john') return user
      if (id === 'group:default/team-a') return group
      return entity
    }));
    const query = createGraphQLTestApp(TestModule, loader)
    const result = yield query(/* GraphQL */`
      node(id: "entity") {
        ...on Entity {
          ownedBy { name }
          owner { name }
          group { name }
        }
      }
    `)
    expect(result).toEqual({
      node: {
        ownedBy: { name: 'John' },
        owner: { name: 'John' },
        group: { name: 'Team A' }
      }
    })
  })

  it('should add resolver for @relation directive with a list', function* () {
    const TestModule = createModule({
      id: 'test',
      typeDefs: gql`
      union Owner = User | Group

      interface Entity @extend(interface: "Node", when: "kind", is: "Entity") {
        ownedBy: [Owner] @relation
        owners: [Owner] @relation(type: "ownedBy")
        users: [User] @relation(type: "ownedBy") # We intentionally don't specify kind here
        groups: [Group] @relation(type: "ownedBy", kind: "Group")
      }
      interface User @extend(interface: "Node", when: "kind", is: "User") {
        username: String! @field(at: "name")
      }
      interface Group @extend(interface: "Node", when: "kind", is: "Group") {
        groupname: String! @field(at: "name")
      }
      `,
    })
    const entity = {
      kind: 'Entity',
      relations: [
        { type: 'ownedBy', targetRef: 'user:default/john' },
        { type: 'ownedBy', targetRef: 'group:default/team-b' },
        { type: 'ownedBy', targetRef: 'user:default/mark' },
        { type: 'ownedBy', targetRef: 'group:default/team-a' }
      ]
    };
    const john = { kind: 'User', name: 'John' };
    const mark = { kind: 'User', name: 'Mark' };
    const teamA = { kind: 'Group', name: 'Team A' };
    const teamB = { kind: 'Group', name: 'Team B' };
    const loader = () => new DataLoader(async (ids) => ids.map(id => {
      if (id === 'user:default/john') return john
      if (id === 'user:default/mark') return mark
      if (id === 'group:default/team-a') return teamA
      if (id === 'group:default/team-b') return teamB
      return entity
    }));
    const query = createGraphQLTestApp(TestModule, loader)
    const result = yield query(/* GraphQL */`
      node(id: "entity") {
        ...on Entity {
          ownedBy { ...on User { username }, ...on Group { groupname } }
          owners { ...on Group { groupname }, ...on User { username } }
          users { username }
          groups { groupname }
        }
      }
    `)
    expect(result).toEqual({
      node: {
        ownedBy: [{ username: 'John' }, { groupname: 'Team B' }, { username: 'Mark' }, { groupname: 'Team A' }],
        owners: [{ username: 'John' }, { groupname: 'Team B' }, { username: 'Mark' }, { groupname: 'Team A' }],
        users: [{ username: 'John' }, { username: 'Team B' }, { username: 'Mark' }, { username: 'Team A' }],
        groups: [{ groupname: 'Team B' }, { groupname: 'Team A' }]
      }
    })
  })

  it('should add resolver for @relation directive with a connection', function* () {
    const TestModule = createModule({
      id: 'test',
      typeDefs: gql`
      union Owner = User | Group

      interface Entity @extend(interface: "Node", when: "kind", is: "Entity") {
        ownedBy: Connection @relation
        nodes: Connection @relation(type: "ownedBy")
        owners: Connection @relation(type: "ownedBy", interface: "Owner")
        users: Connection @relation(type: "ownedBy", interface: "User") # We intentionally don't specify kind here
        groups: Connection @relation(type: "ownedBy", kind: "Group", interface: "Group")
      }
      interface User @extend(interface: "Node", when: "kind", is: "User") {
        username: String! @field(at: "name")
      }
      interface Group @extend(interface: "Node", when: "kind", is: "Group") {
        groupname: String! @field(at: "name")
      }
      `,
    })
    const entity = {
      kind: 'Entity',
      relations: [
        { type: 'ownedBy', targetRef: 'user:default/john' },
        { type: 'ownedBy', targetRef: 'group:default/team-b' },
        { type: 'ownedBy', targetRef: 'user:default/mark' },
        { type: 'ownedBy', targetRef: 'group:default/team-a' }
      ]
    };
    const john = { kind: 'User', name: 'John' };
    const mark = { kind: 'User', name: 'Mark' };
    const teamA = { kind: 'Group', name: 'Team A' };
    const teamB = { kind: 'Group', name: 'Team B' };
    const loader = () => new DataLoader(async (ids) => ids.map(id => {
      if (id === 'user:default/john') return john
      if (id === 'user:default/mark') return mark
      if (id === 'group:default/team-a') return teamA
      if (id === 'group:default/team-b') return teamB
      return entity
    }));
    const query = createGraphQLTestApp(TestModule, loader)
    const result = yield query(/* GraphQL */`
      node(id: "entity") {
        ...on Entity {
          ownedBy(first: 2) { edges { node { ...on User { username }, ...on Group { groupname } } } }
          nodes(first: 2, after: "YXJyYXljb25uZWN0aW9uOjE=") { edges { node { ...on Group { groupname }, ...on User { username } } } }
          owners(last: 2) { edges { node { id, ...on User { username } } } }
          users { count, edges { node { username } } }
          groups { edges { node { groupname } } }
        }
      }
    `)
    expect(result).toEqual({
      node: {
        ownedBy: { edges: [{ node: { username: 'John' } }, { node: { groupname: 'Team B' } }] },
        nodes: { edges: [{ node: { username: 'Mark' } }, { node: { groupname: 'Team A' } }] },
        owners: { edges: [{ node: { id: 'user:default/mark', username: 'Mark' } }, { node: { id: 'group:default/team-a' } }] },
        users: {
          count: 4,
          edges: [
            { node: { username: 'John' } },
            { node: { username: 'Team B' } },
            { node: { username: 'Mark' } },
            { node: { username: 'Team A' } }
          ]
        },
        groups: { edges: [{ node: { groupname: 'Team B' } }, { node: { groupname: 'Team A' } }] },
      }
    })
  })

  it('resolver for @relation without `type` argument should return all relations', function* () {
    const TestModule = createModule({
      id: 'test',
      typeDefs: gql`
      interface Entity @extend(interface: "Node", when: "kind", is: "Entity") {
        assets: [Node] @relation
      }
      interface User @extend(interface: "Node", when: "kind", is: "User") {
        username: String! @field(at: "name")
      }
      interface Group @extend(interface: "Node", when: "kind", is: "Group") {
        groupname: String! @field(at: "name")
      }
      interface Component @extend(interface: "Node", when: "kind", is: "Component") {
        name: String! @field(at: "name")
      }
      interface Resource @extend(interface: "Node", when: "kind", is: "Resource") {
        domain: String! @field(at: "name")
      }
      `,
    })
    const entity = {
      kind: 'Entity',
      relations: [
        { type: 'partOf', targetRef: 'resource:default/website' },
        { type: 'hasPart', targetRef: 'component:default/backend' },
        { type: 'ownedBy', targetRef: 'user:default/john' },
        { type: 'ownedBy', targetRef: 'group:default/team-b' },
      ]
    };
    const john = { kind: 'User', name: 'John' };
    const backend = { kind: 'Component', name: 'Backend' };
    const website = { kind: 'Resource', name: 'example.com' };
    const teamB = { kind: 'Group', name: 'Team B' };
    const loader = () => new DataLoader(async (ids) => ids.map(id => {
      if (id === 'user:default/john') return john
      if (id === 'component:default/backend') return backend
      if (id === 'resource:default/website') return website
      if (id === 'group:default/team-b') return teamB
      return entity
    }));
    const query = createGraphQLTestApp(TestModule, loader)
    const result = yield query(/* GraphQL */`
      node(id: "entity") {
        ...on Entity {
          assets {
            id
            ...on User { username }
            ...on Group { groupname }
            ...on Component { name }
            ...on Resource { domain }
          }
        }
      }
    `)
    expect(result).toEqual({
      node: {
     assets: [
         { domain: "example.com", id: "resource:default/website" },
         { id: "component:default/backend", name: "Backend" },
         { id: "user:default/john", username: "John" },
         { groupname: "Team B", id: "group:default/team-b" },
       ],
      }
    })
  })
});
