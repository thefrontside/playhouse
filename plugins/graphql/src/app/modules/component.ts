import { createModule, gql } from 'graphql-modules';
import {
  id,
  name,
  namespace,
  title,
  description,
  tags,
  links,
} from '../resolvers';
import { entityToNode } from '../mappers'

export const Component = createModule({
  id: `component`,
  typeDefs: gql`
    enum Lifecycle {
      EXPERIMENTAL
      PRODUCTION
      DEPRECATED
    }

    type Component implements Node & Entity {
      id: ID!
      name: String!
      namespace: String
      title: String
      description: String
      tags: [String]
      links: [EntityLink]

      type: String! #@field(at: "spec.type")
      lifecycle: Lifecycle! #@field(at: "spec.lifecycle")
      owner: Owner! #@field(at: "spec.owner")
      # subcomponentOf: Component #@field(at: "spec.subcomponentOf")
      # components: [Component] # Use ComponentConnection
      # providesApis: [API] #@field(at: "spec.providesApis")
      # consumesApis: [API] #@field(at: "spec.consumesApis")
      # dependencies: [Resource] #@field(at: "spec.dependsOn")
      # system: System #@field(at: "spec.system")
    }
  `,
  // providers: [entityToNode()]
  // resolvers: {
  //   Component: {
  //     id,
  //     name,
  //     namespace,
  //     title,
  //     description,
  //     tags,
  //     links,
  //   },
  // },
});
