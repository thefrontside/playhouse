function graphql(str: TemplateStringsArray) {
  return str.join('')
}

// NOTE This schema will be generated in runtime
export default graphql`
interface Node {
  id: ID! #@field(at: "metadata.uid")
}

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

enum Lifecycle {
  EXPERIMENTAL
  PRODUCTION
  DEPRECATED
}

union Owner = User | Group

# type:
# Location - url
# Component - service, library, website
# API - openapi, grpc, asyncapi
# Resource - database
# Group - team, organization, sub-department, department

# Basic types
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
  subcomponentOf: Component #@field(at: "spec.subcomponentOf")
  components: [Component]
  providesApis: [API] #@field(at: "spec.providesApis")
  consumesApis: [API] #@field(at: "spec.consumesApis")
  dependencies: [Resource] #@field(at: "spec.dependsOn")
  system: System #@field(at: "spec.system")
}

type System implements Node & Entity {
  id: ID!
  name: String!
  namespace: String
  title: String
  description: String
  tags: [String]
  links: [EntityLink]

  owner: Owner! #@field(at: "spec.owner")
  domain: Domain #@field(at: "spec.domain")
  components: [Component]
  resources: [Resource]
}

type API implements Node & Entity {
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
  definition: String! #@field(at: "spec.definition")
  system: System #@field(at: "spec.system")
  consumers: [Component]
  providers: [Component]
}

union Ownable = System | Resource | Component | API | Domain | Template

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

type Resource implements Node & Entity {
  id: ID!
  name: String!
  namespace: String
  title: String
  description: String
  tags: [String]
  links: [EntityLink]

  type: String! #@field(at: "spec.type")
  owner: Owner! #@field(at: "spec.owner")
  dependencyOf: [Component]
  system: System #@field(at: "spec.system")
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

  type: String #@field(at: "spec.type")
  target: String #@field(at: "spec.target")
  targets: [String] #@field(at: "spec.targets")
  presence: Presence #@field(at: "spec.presence")
}

type Domain implements Node & Entity {
  id: ID!
  name: String!
  namespace: String
  title: String
  description: String
  tags: [String]
  links: [EntityLink]

  owner: Owner! #@field(at: "spec.owner")
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

  type: String! #@field(at: "spec.type")
  # parameters?: JsonObject | JsonObject[]
  steps: [Step]! #@field(at: "spec.steps")
  # output?: { [name: string]: string }
  owner: Owner #@field(at: "spec.owner")
}

directive #@field(at: String = "") on FIELD_DEFINITION

type Query {
  node(id: ID!): Node
}
`
