import { Entity, TemplateEntityV1beta2 } from "@backstage/catalog-model";
import { createModule, gql } from "graphql-modules";
import GraphQLJSON, { GraphQLJSONObject } from 'graphql-type-json';
import { pascalCase } from 'pascal-case'
import { resolverProvider } from "../resolver";

export const Template = createModule({
  id: 'Template',
  typeDefs: gql`
    scalar JSON
    scalar JSONObject
    union Ownable = Website | Documentation | Service

    type Step {
      id: String
      name: String
      action: String!
      input: JSONObject
      if: JSON
    }

    interface Template {
      parameters: JSONObject @field(at: "spec.parameters ")
      steps: [Step]! @field(at: "spec.steps")
      output: JSONObject @field(at: "spec.output")
      owner: Owner @relation(type: "ownedBy")
    }

    type Website implements Node & Entity & Template {
      id: ID!

      name: String!
      namespace: String
      title: String
      description: String
      tags: [String!]
      links: [EntityLink!]

      parameters: JSONObject
      steps: [Step]!
      output: JSONObject
      owner: Owner
    }

    type Documentation implements Node & Entity & Template {
      id: ID!

      name: String!
      namespace: String
      title: String
      description: String
      tags: [String!]
      links: [EntityLink!]

      parameters: JSONObject
      steps: [Step]!
      output: JSONObject
      owner: Owner
    }

    type Service implements Node & Entity & Template {
      id: ID!

      name: String!
      namespace: String
      title: String
      description: String
      tags: [String!]
      links: [EntityLink!]

      parameters: JSONObject
      steps: [Step]!
      output: JSONObject
      owner: Owner
    }
  `,
  resolvers: {
    JSON: GraphQLJSON,
    JSONObject: GraphQLJSONObject,
  },
  providers: [
    resolverProvider({
      accept: (entity: Entity): entity is TemplateEntityV1beta2 => entity.kind === 'Template',
      resolve: entity => entity ? ({ __typeName: pascalCase(entity.spec.type), ...entity }) : null,
    }),
  ],
})
