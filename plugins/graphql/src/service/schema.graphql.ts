function graphql(str: TemplateStringsArray) {
  return str.join('')
}

// NOTE This schema will be generated in runtime
export default graphql`
interface Node {
  id: ID! @field(at: "metadata.uid")
}

interface Entity {
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

# Basic types
type Component implements Node & Entity {
  id: ID!
  name: String!
  namespace: String
  title: String
  description: String
  tags: [String]
  links: [EntityLink]

  type: String! @field(at: "spec.type")
  lifecycle: String! @field(at: "spec.lifecycle")
  owner: String! @field(at: "spec.owner")
  subcomponentOf: String @field(at: "spec.subcomponentOf")
  providesApis: [String] @field(at: "spec.providesApis")
  consumesApis: [String] @field(at: "spec.consumesApis")
  dependsOn: [String] @field(at: "spec.dependsOn")
  system: String @field(at: "spec.system")
}

type System implements Node & Entity {
  id: ID!
  name: String!
  namespace: String
  title: String
  description: String
  tags: [String]
  links: [EntityLink]

  owner: String! @field(at: "spec.owner")
  domain: String @field(at: "spec.domain")
}

type API implements Node & Entity {
  id: ID!
  name: String!
  namespace: String
  title: String
  description: String
  tags: [String]
  links: [EntityLink]

  type: String! @field(at: "spec.type")
  lifecycle: String! @field(at: "spec.lifecycle")
  owner: String! @field(at: "spec.owner")
  definition: String! @field(at: "spec.definition")
  system: String @field(at: "spec.system")
}

type Group implements Node & Entity {
  id: ID!
  name: String!
  namespace: String
  title: String
  description: String
  tags: [String]
  links: [EntityLink]

  type: String! @field(at: "spec.type")
  children: [String]! @field(at: "spec.children")
  displayName: String @field(at: "spec.profile.displayName")
  email: String @field(at: "spec.profile.email")
  picture: String @field(at: "spec.profile.picture")
  parent: String @field(at: "spec.parent")
  members: [String] @field(at: "spec.members")
}

type User implements Node & Entity {
  id: ID!
  name: String!
  namespace: String
  title: String
  description: String
  tags: [String]
  links: [EntityLink]

  memberOf: [String]! @field(at: "spec.memberOf")
  displayName: String @field(at: "spec.profile.displayName")
  email: String @field(at: "spec.profile.email")
  picture: String @field(at: "spec.profile.picture")
}

type Resource implements Node & Entity {
  id: ID!
  name: String!
  namespace: String
  title: String
  description: String
  tags: [String]
  links: [EntityLink]

  type: String! @field(at: "spec.type")
  owner: String! @field(at: "spec.owner")
  dependsOn: [String] @field(at: "spec.dependsOn")
  system: String @field(at: "spec.system")
}

enum Presence {
  REQUIRED
  OPTIONAL
}

type Location implements Node & Entity {
  id: ID!
  name: String!
  namespace: String
  title: String
  description: String
  tags: [String]
  links: [EntityLink]

  type: String @field(at: "spec.type")
  target: String @field(at: "spec.target")
  targets: [String] @field(at: "spec.targets")
  presence: Presence @field(at: "spec.presence")
}

type Domain implements Node & Entity {
  id: ID!
  name: String!
  namespace: String
  title: String
  description: String
  tags: [String]
  links: [EntityLink]

  owner: String! @field(at: "spec.owner")
}

union StepIf = String | Boolean

type Step {
  id: String
  name: String
  action: String!
  # input?: JsonObject
  if: StepIf
}

type Template implements Node & Entity {
  id: ID!
  name: String!
  namespace: String
  title: String
  description: String
  tags: [String]
  links: [EntityLink]

  type: String! @field(at: "spec.type")
  # parameters?: JsonObject | JsonObject[]
  steps: [Step]! @field(at: "spec.steps")
  # output?: { [name: string]: string }
  owner: String @field(at: "spec.owner")
}

directive @field(at: String = "") on FIELD_DEFINITION

type Query {
  node(id: ID!): Node
}
`
