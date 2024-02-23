import {
  transformSchema,
} from '@frontside/hydraphql';
import { DocumentNode, GraphQLNamedType, printType } from 'graphql';
import { Module, createModule, gql } from 'graphql-modules';
import { Relation } from './relation/relation';

describe('generateEntitiesQueryInputTypes', () => {
  const transform = (source: DocumentNode, anotherModule?: Module) =>
    transformSchema([
      Relation(),
      createModule({
        id: 'generateEntitiesQueryInputTypes',
        typeDefs: source,
      }),
      ...(anotherModule ? [anotherModule] : []),
    ]);

  it('should generate dummy input types', () => {
    const schema = transform(gql`
      type Foo {
        id: ID!
      }
    `);

    expect(printType(schema.getType('EntityOrderField') as GraphQLNamedType).split('\n')).toEqual([
      'input EntityOrderField {',
      '  _dummy: OrderDirection',
      '}',
    ]);
    expect(printType(schema.getType('EntityTextFilterFields') as GraphQLNamedType).split('\n')).toEqual([
      'input EntityTextFilterFields {',
      '  _dummy: Boolean',
      '}',
    ]);
    expect(printType(schema.getType('EntityFilterExpression') as GraphQLNamedType).split('\n')).toEqual([
      'input EntityFilterExpression {',
      '  _dummy: [JSON!]',
      '}',
    ]);
  })

  it('should generate plain input types for primitive fields', () => {
    const schema = transform(gql`
      extend interface Entity {
        name: String! @field(at: "metadata.name")
        kind: String! @field(at: "kind")
        namespace: String! @field(at: "metadata.namespace", default: "default")
        apiVersion: String! @field(at: "apiVersion")
        title: String @field(at: "metadata.title")
        description: String @field(at: "metadata.description")
      }
    `);

    expect(printType(schema.getType('EntityOrderField') as GraphQLNamedType).split('\n')).toEqual([
      'input EntityOrderField {',
      '  name: OrderDirection',
      '  kind: OrderDirection',
      '  namespace: OrderDirection',
      '  apiVersion: OrderDirection',
      '  title: OrderDirection',
      '  description: OrderDirection',
      '}',
    ]);
    expect(printType(schema.getType('EntityTextFilterFields') as GraphQLNamedType).split('\n')).toEqual([
      'input EntityTextFilterFields {',
      '  name: Boolean',
      '  kind: Boolean',
      '  namespace: Boolean',
      '  apiVersion: Boolean',
      '  title: Boolean',
      '  description: Boolean',
      '}',
    ]);
    expect(printType(schema.getType('EntityFilterExpression') as GraphQLNamedType).split('\n')).toEqual([
      'input EntityFilterExpression {',
      '  name: [JSON!]',
      '  kind: [JSON!]',
      '  namespace: [JSON!]',
      '  apiVersion: [JSON!]',
      '  title: [JSON!]',
      '  description: [JSON!]',
      '}',
    ]);
  })

  it('should generate input types for composite fields', () => {
    const schema = transform(gql`
      extend interface Entity {
        metadata: Metadata! @field(at: "metadata")
      }

      type Metadata {
        name: String! @field
        namespace: String! @field
      }
    `);

    expect(printType(schema.getType('EntityOrderField') as GraphQLNamedType).split('\n')).toEqual([
      'input EntityOrderField {',
      '  metadata: [EntityOrderField_Metadata!]',
      '}',
    ]);
    expect(printType(schema.getType('EntityOrderField_Metadata') as GraphQLNamedType).split('\n')).toEqual([
      'input EntityOrderField_Metadata {',
      '  name: OrderDirection',
      '  namespace: OrderDirection',
      '}',
    ]);

    expect(printType(schema.getType('EntityTextFilterFields') as GraphQLNamedType).split('\n')).toEqual([
      'input EntityTextFilterFields {',
      '  metadata: EntityTextFilterFields_Metadata',
      '}',
    ]);
    expect(printType(schema.getType('EntityTextFilterFields_Metadata') as GraphQLNamedType).split('\n')).toEqual([
      'input EntityTextFilterFields_Metadata {',
      '  name: Boolean',
      '  namespace: Boolean',
      '}',
    ]);

    expect(printType(schema.getType('EntityFilterExpression') as GraphQLNamedType).split('\n')).toEqual([
      'input EntityFilterExpression {',
      '  metadata: EntityFilterExpression_Metadata',
      '}',
    ]);
    expect(printType(schema.getType('EntityFilterExpression_Metadata') as GraphQLNamedType).split('\n')).toEqual([
      'input EntityFilterExpression_Metadata {',
      '  name: [JSON!]',
      '  namespace: [JSON!]',
      '}',
    ]);
  })

  it('should generate input types for mixed fields (plain and composite)', () => {
    const schema = transform(gql`
      extend interface Entity @discriminates(with: "kind") {
        kind: String! @field(at: "kind")
      }

      type Component @implements(interface: "Entity") {
        target: String! @field(at: "spec.target")
      }

      type Location @implements(interface: "Entity") {
        target: Target! @field(at: "spec.target")
      }

      type Target {
        host: String! @field
        port: Int! @field
      }
    `);

    expect(printType(schema.getType('EntityOrderField') as GraphQLNamedType).split('\n')).toEqual([
      'input EntityOrderField {',
      '  kind: OrderDirection',
      '  target: EntityOrderField_Target',
      '}',
    ]);
    expect(printType(schema.getType('EntityOrderField_Target') as GraphQLNamedType).split('\n')).toEqual([
      'input EntityOrderField_Target {',
      '  order: OrderDirection',
      '  fields: [EntityOrderField__Target!]',
      '}',
    ]);
    expect(printType(schema.getType('EntityOrderField__Target') as GraphQLNamedType).split('\n')).toEqual([
      'input EntityOrderField__Target {',
      '  host: OrderDirection',
      '  port: OrderDirection',
      '}',
    ]);

    expect(printType(schema.getType('EntityTextFilterFields') as GraphQLNamedType).split('\n')).toEqual([
      'input EntityTextFilterFields {',
      '  kind: Boolean',
      '  target: EntityTextFilterFields_Target',
      '}',
    ]);
    expect(printType(schema.getType('EntityTextFilterFields_Target') as GraphQLNamedType).split('\n')).toEqual([
      'input EntityTextFilterFields_Target {',
      '  include: Boolean',
      '  fields: EntityTextFilterFields__Target',
      '}',
    ]);
    expect(printType(schema.getType('EntityTextFilterFields__Target') as GraphQLNamedType).split('\n')).toEqual([
      'input EntityTextFilterFields__Target {',
      '  host: Boolean',
      '  port: Boolean',
      '}',
    ]);

    expect(printType(schema.getType('EntityFilterExpression') as GraphQLNamedType).split('\n')).toEqual([
      'input EntityFilterExpression {',
      '  kind: [JSON!]',
      '  target: EntityFilterExpression_Target',
      '}',
    ]);
    expect(printType(schema.getType('EntityFilterExpression_Target') as GraphQLNamedType).split('\n')).toEqual([
      'input EntityFilterExpression_Target {',
      '  values: [JSON!]',
      '  fields: EntityFilterExpression__Target',
      '}',
    ]);
    expect(printType(schema.getType('EntityFilterExpression__Target') as GraphQLNamedType).split('\n')).toEqual([
      'input EntityFilterExpression__Target {',
      '  host: [JSON!]',
      '  port: [JSON!]',
      '}',
    ]);
  })
})
