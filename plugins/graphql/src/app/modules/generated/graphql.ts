/* eslint-disable */
import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  JSON: any;
  JSONObject: any;
};

export type Api = {
  consumers?: Maybe<Array<Maybe<Component>>>;
  definition: Scalars['String'];
  lifecycle: Lifecycle;
  owner: Owner;
  providers?: Maybe<Array<Maybe<Component>>>;
  system?: Maybe<System>;
};

export type Asyncapi = Api & Entity & Node & {
  __typename?: 'Asyncapi';
  consumers?: Maybe<Array<Maybe<Component>>>;
  definition: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  lifecycle: Lifecycle;
  links?: Maybe<Array<EntityLink>>;
  name: Scalars['String'];
  namespace?: Maybe<Scalars['String']>;
  owner: Owner;
  providers?: Maybe<Array<Maybe<Component>>>;
  system?: Maybe<System>;
  tags?: Maybe<Array<Scalars['String']>>;
  title?: Maybe<Scalars['String']>;
};

export type Component = {
  component?: Maybe<Component>;
  consumesApi?: Maybe<Array<Maybe<Api>>>;
  dependencies?: Maybe<Array<Maybe<Dependency>>>;
  lifecycle: Lifecycle;
  owner: Owner;
  providesApi?: Maybe<Array<Maybe<Api>>>;
  subComponents?: Maybe<Array<Maybe<Component>>>;
  system?: Maybe<System>;
};

export type Database = Entity & Node & Resource & {
  __typename?: 'Database';
  dependencies?: Maybe<Array<Maybe<Dependency>>>;
  dependents?: Maybe<Array<Maybe<Dependency>>>;
  description?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  links?: Maybe<Array<EntityLink>>;
  name: Scalars['String'];
  namespace?: Maybe<Scalars['String']>;
  owner: Owner;
  systems?: Maybe<Array<Maybe<System>>>;
  tags?: Maybe<Array<Scalars['String']>>;
  title?: Maybe<Scalars['String']>;
};

export type Department = Entity & Group & Node & {
  __typename?: 'Department';
  children: Array<Maybe<Group>>;
  description?: Maybe<Scalars['String']>;
  displayName?: Maybe<Scalars['String']>;
  email?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  links?: Maybe<Array<Maybe<EntityLink>>>;
  members?: Maybe<Array<Maybe<User>>>;
  name: Scalars['String'];
  namespace?: Maybe<Scalars['String']>;
  ownerOf?: Maybe<Array<Maybe<Ownable>>>;
  parent?: Maybe<Organization>;
  picture?: Maybe<Scalars['String']>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  title?: Maybe<Scalars['String']>;
};

export type Dependency = Database | Library | Service | Website;

export type Documentation = Entity & Node & Template & {
  __typename?: 'Documentation';
  description?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  links?: Maybe<Array<EntityLink>>;
  name: Scalars['String'];
  namespace?: Maybe<Scalars['String']>;
  output?: Maybe<Scalars['JSONObject']>;
  owner?: Maybe<Owner>;
  parameters?: Maybe<Scalars['JSONObject']>;
  steps: Array<Maybe<Step>>;
  tags?: Maybe<Array<Scalars['String']>>;
  title?: Maybe<Scalars['String']>;
};

export type Domain = Entity & Node & {
  __typename?: 'Domain';
  description?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  links?: Maybe<Array<Maybe<EntityLink>>>;
  name: Scalars['String'];
  namespace?: Maybe<Scalars['String']>;
  owner: Owner;
  systems?: Maybe<Array<Maybe<System>>>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  title?: Maybe<Scalars['String']>;
};

export type Entity = {
  description?: Maybe<Scalars['String']>;
  links?: Maybe<Array<Maybe<EntityLink>>>;
  name: Scalars['String'];
  namespace?: Maybe<Scalars['String']>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  title?: Maybe<Scalars['String']>;
};

export type EntityLink = {
  __typename?: 'EntityLink';
  icon?: Maybe<Scalars['String']>;
  title?: Maybe<Scalars['String']>;
  url: Scalars['String'];
};

export type Graphql = Api & Entity & Node & {
  __typename?: 'Graphql';
  consumers?: Maybe<Array<Maybe<Component>>>;
  definition: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  lifecycle: Lifecycle;
  links?: Maybe<Array<EntityLink>>;
  name: Scalars['String'];
  namespace?: Maybe<Scalars['String']>;
  owner: Owner;
  providers?: Maybe<Array<Maybe<Component>>>;
  system?: Maybe<System>;
  tags?: Maybe<Array<Scalars['String']>>;
  title?: Maybe<Scalars['String']>;
};

export type Group = {
  children: Array<Maybe<Group>>;
  displayName?: Maybe<Scalars['String']>;
  email?: Maybe<Scalars['String']>;
  members?: Maybe<Array<Maybe<User>>>;
  ownerOf?: Maybe<Array<Maybe<Ownable>>>;
  parent?: Maybe<Group>;
  picture?: Maybe<Scalars['String']>;
};

export type Grpc = Api & Entity & Node & {
  __typename?: 'Grpc';
  consumers?: Maybe<Array<Maybe<Component>>>;
  definition: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  lifecycle: Lifecycle;
  links?: Maybe<Array<EntityLink>>;
  name: Scalars['String'];
  namespace?: Maybe<Scalars['String']>;
  owner: Owner;
  providers?: Maybe<Array<Maybe<Component>>>;
  system?: Maybe<System>;
  tags?: Maybe<Array<Scalars['String']>>;
  title?: Maybe<Scalars['String']>;
};

export type Library = Component & Entity & Node & {
  __typename?: 'Library';
  component?: Maybe<Component>;
  consumesApi?: Maybe<Array<Maybe<Api>>>;
  dependencies?: Maybe<Array<Maybe<Dependency>>>;
  description?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  lifecycle: Lifecycle;
  links?: Maybe<Array<EntityLink>>;
  name: Scalars['String'];
  namespace?: Maybe<Scalars['String']>;
  owner: Owner;
  providesApi?: Maybe<Array<Maybe<Api>>>;
  subComponents?: Maybe<Array<Maybe<Component>>>;
  system?: Maybe<System>;
  tags?: Maybe<Array<Scalars['String']>>;
  title?: Maybe<Scalars['String']>;
};

export type Lifecycle =
  | 'DEPRECATED'
  | 'EXPERIMENTAL'
  | 'PRODUCTION';

export type Location = Entity & Node & {
  __typename?: 'Location';
  description?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  links?: Maybe<Array<EntityLink>>;
  name: Scalars['String'];
  namespace?: Maybe<Scalars['String']>;
  tags?: Maybe<Array<Scalars['String']>>;
  target?: Maybe<Scalars['String']>;
  targets?: Maybe<Array<Maybe<Scalars['String']>>>;
  title?: Maybe<Scalars['String']>;
  type?: Maybe<Scalars['String']>;
};

export type Never = Node & {
  __typename?: 'Never';
  id: Scalars['ID'];
};

export type Node = {
  id: Scalars['ID'];
};

export type Openapi = Api & Entity & Node & {
  __typename?: 'Openapi';
  consumers?: Maybe<Array<Maybe<Component>>>;
  definition: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  lifecycle: Lifecycle;
  links?: Maybe<Array<EntityLink>>;
  name: Scalars['String'];
  namespace?: Maybe<Scalars['String']>;
  owner: Owner;
  providers?: Maybe<Array<Maybe<Component>>>;
  system?: Maybe<System>;
  tags?: Maybe<Array<Scalars['String']>>;
  title?: Maybe<Scalars['String']>;
};

export type Organization = Entity & Group & Node & {
  __typename?: 'Organization';
  children: Array<Maybe<Group>>;
  description?: Maybe<Scalars['String']>;
  displayName?: Maybe<Scalars['String']>;
  email?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  links?: Maybe<Array<Maybe<EntityLink>>>;
  members?: Maybe<Array<Maybe<User>>>;
  name: Scalars['String'];
  namespace?: Maybe<Scalars['String']>;
  ownerOf?: Maybe<Array<Maybe<Ownable>>>;
  parent?: Maybe<Group>;
  picture?: Maybe<Scalars['String']>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  title?: Maybe<Scalars['String']>;
};

export type Ownable = Asyncapi | Database | Documentation | Domain | Graphql | Grpc | Library | Openapi | Service | System | Website;

export type Owner = Department | Organization | SubDepartment | Team | User;

export type Query = {
  __typename?: 'Query';
  entity?: Maybe<Entity>;
  node?: Maybe<Node>;
};


export type QueryEntityArgs = {
  kind: Scalars['String'];
  name: Scalars['String'];
  namespace?: InputMaybe<Scalars['String']>;
};


export type QueryNodeArgs = {
  id: Scalars['ID'];
};

export type Resource = {
  dependencies?: Maybe<Array<Maybe<Dependency>>>;
  dependents?: Maybe<Array<Maybe<Dependency>>>;
  owner: Owner;
  systems?: Maybe<Array<Maybe<System>>>;
};

export type Service = Component & Entity & Node & Template & {
  __typename?: 'Service';
  component?: Maybe<Component>;
  consumesApi?: Maybe<Array<Maybe<Api>>>;
  dependencies?: Maybe<Array<Maybe<Dependency>>>;
  description?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  lifecycle: Lifecycle;
  links?: Maybe<Array<EntityLink>>;
  name: Scalars['String'];
  namespace?: Maybe<Scalars['String']>;
  output?: Maybe<Scalars['JSONObject']>;
  owner: Owner;
  parameters?: Maybe<Scalars['JSONObject']>;
  providesApi?: Maybe<Array<Maybe<Api>>>;
  steps: Array<Maybe<Step>>;
  subComponents?: Maybe<Array<Maybe<Component>>>;
  system?: Maybe<System>;
  tags?: Maybe<Array<Scalars['String']>>;
  title?: Maybe<Scalars['String']>;
};

export type Step = {
  __typename?: 'Step';
  action: Scalars['String'];
  id?: Maybe<Scalars['String']>;
  if?: Maybe<Scalars['JSON']>;
  input?: Maybe<Scalars['JSONObject']>;
  name?: Maybe<Scalars['String']>;
};

export type SubDepartment = Entity & Group & Node & {
  __typename?: 'SubDepartment';
  children: Array<Maybe<Group>>;
  description?: Maybe<Scalars['String']>;
  displayName?: Maybe<Scalars['String']>;
  email?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  links?: Maybe<Array<Maybe<EntityLink>>>;
  members?: Maybe<Array<Maybe<User>>>;
  name: Scalars['String'];
  namespace?: Maybe<Scalars['String']>;
  ownerOf?: Maybe<Array<Maybe<Ownable>>>;
  parent?: Maybe<Department>;
  picture?: Maybe<Scalars['String']>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  title?: Maybe<Scalars['String']>;
};

export type System = Entity & Node & {
  __typename?: 'System';
  components?: Maybe<Array<Maybe<Component>>>;
  description?: Maybe<Scalars['String']>;
  domain?: Maybe<Domain>;
  id: Scalars['ID'];
  links?: Maybe<Array<Maybe<EntityLink>>>;
  name: Scalars['String'];
  namespace?: Maybe<Scalars['String']>;
  owner: Owner;
  resources?: Maybe<Array<Maybe<Resource>>>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  title?: Maybe<Scalars['String']>;
};

export type Team = Entity & Group & Node & {
  __typename?: 'Team';
  children: Array<Maybe<Group>>;
  description?: Maybe<Scalars['String']>;
  displayName?: Maybe<Scalars['String']>;
  email?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  links?: Maybe<Array<Maybe<EntityLink>>>;
  members?: Maybe<Array<Maybe<User>>>;
  name: Scalars['String'];
  namespace?: Maybe<Scalars['String']>;
  ownerOf?: Maybe<Array<Maybe<Ownable>>>;
  parent?: Maybe<SubDepartment>;
  picture?: Maybe<Scalars['String']>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  title?: Maybe<Scalars['String']>;
};

export type Template = {
  output?: Maybe<Scalars['JSONObject']>;
  owner?: Maybe<Owner>;
  parameters?: Maybe<Scalars['JSONObject']>;
  steps: Array<Maybe<Step>>;
};

export type User = Entity & Node & {
  __typename?: 'User';
  description?: Maybe<Scalars['String']>;
  displayName?: Maybe<Scalars['String']>;
  email?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  links?: Maybe<Array<Maybe<EntityLink>>>;
  memberOf: Array<Maybe<Group>>;
  name: Scalars['String'];
  namespace?: Maybe<Scalars['String']>;
  ownerOf?: Maybe<Array<Maybe<Ownable>>>;
  picture?: Maybe<Scalars['String']>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  title?: Maybe<Scalars['String']>;
};

export type Website = Component & Entity & Node & Template & {
  __typename?: 'Website';
  component?: Maybe<Component>;
  consumesApi?: Maybe<Array<Maybe<Api>>>;
  dependencies?: Maybe<Array<Maybe<Dependency>>>;
  description?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  lifecycle: Lifecycle;
  links?: Maybe<Array<EntityLink>>;
  name: Scalars['String'];
  namespace?: Maybe<Scalars['String']>;
  output?: Maybe<Scalars['JSONObject']>;
  owner: Owner;
  parameters?: Maybe<Scalars['JSONObject']>;
  providesApi?: Maybe<Array<Maybe<Api>>>;
  steps: Array<Maybe<Step>>;
  subComponents?: Maybe<Array<Maybe<Component>>>;
  system?: Maybe<System>;
  tags?: Maybe<Array<Scalars['String']>>;
  title?: Maybe<Scalars['String']>;
};



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  API: ResolversTypes['Asyncapi'] | ResolversTypes['Graphql'] | ResolversTypes['Grpc'] | ResolversTypes['Openapi'];
  Asyncapi: ResolverTypeWrapper<Omit<Asyncapi, 'owner'> & { owner: ResolversTypes['Owner'] }>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  Component: ResolversTypes['Library'] | ResolversTypes['Service'] | ResolversTypes['Website'];
  Database: ResolverTypeWrapper<Omit<Database, 'dependencies' | 'dependents' | 'owner'> & { dependencies?: Maybe<Array<Maybe<ResolversTypes['Dependency']>>>, dependents?: Maybe<Array<Maybe<ResolversTypes['Dependency']>>>, owner: ResolversTypes['Owner'] }>;
  Department: ResolverTypeWrapper<Omit<Department, 'ownerOf'> & { ownerOf?: Maybe<Array<Maybe<ResolversTypes['Ownable']>>> }>;
  Dependency: ResolversTypes['Database'] | ResolversTypes['Library'] | ResolversTypes['Service'] | ResolversTypes['Website'];
  Documentation: ResolverTypeWrapper<Omit<Documentation, 'owner'> & { owner?: Maybe<ResolversTypes['Owner']> }>;
  Domain: ResolverTypeWrapper<Omit<Domain, 'owner'> & { owner: ResolversTypes['Owner'] }>;
  Entity: ResolversTypes['Asyncapi'] | ResolversTypes['Database'] | ResolversTypes['Department'] | ResolversTypes['Documentation'] | ResolversTypes['Domain'] | ResolversTypes['Graphql'] | ResolversTypes['Grpc'] | ResolversTypes['Library'] | ResolversTypes['Location'] | ResolversTypes['Openapi'] | ResolversTypes['Organization'] | ResolversTypes['Service'] | ResolversTypes['SubDepartment'] | ResolversTypes['System'] | ResolversTypes['Team'] | ResolversTypes['User'] | ResolversTypes['Website'];
  EntityLink: ResolverTypeWrapper<EntityLink>;
  Graphql: ResolverTypeWrapper<Omit<Graphql, 'owner'> & { owner: ResolversTypes['Owner'] }>;
  Group: ResolversTypes['Department'] | ResolversTypes['Organization'] | ResolversTypes['SubDepartment'] | ResolversTypes['Team'];
  Grpc: ResolverTypeWrapper<Omit<Grpc, 'owner'> & { owner: ResolversTypes['Owner'] }>;
  ID: ResolverTypeWrapper<Scalars['ID']>;
  JSON: ResolverTypeWrapper<Scalars['JSON']>;
  JSONObject: ResolverTypeWrapper<Scalars['JSONObject']>;
  Library: ResolverTypeWrapper<Omit<Library, 'dependencies' | 'owner'> & { dependencies?: Maybe<Array<Maybe<ResolversTypes['Dependency']>>>, owner: ResolversTypes['Owner'] }>;
  Lifecycle: Lifecycle;
  Location: ResolverTypeWrapper<Location>;
  Never: ResolverTypeWrapper<Never>;
  Node: ResolversTypes['Asyncapi'] | ResolversTypes['Database'] | ResolversTypes['Department'] | ResolversTypes['Documentation'] | ResolversTypes['Domain'] | ResolversTypes['Graphql'] | ResolversTypes['Grpc'] | ResolversTypes['Library'] | ResolversTypes['Location'] | ResolversTypes['Never'] | ResolversTypes['Openapi'] | ResolversTypes['Organization'] | ResolversTypes['Service'] | ResolversTypes['SubDepartment'] | ResolversTypes['System'] | ResolversTypes['Team'] | ResolversTypes['User'] | ResolversTypes['Website'];
  Openapi: ResolverTypeWrapper<Omit<Openapi, 'owner'> & { owner: ResolversTypes['Owner'] }>;
  Organization: ResolverTypeWrapper<Omit<Organization, 'ownerOf'> & { ownerOf?: Maybe<Array<Maybe<ResolversTypes['Ownable']>>> }>;
  Ownable: ResolversTypes['Asyncapi'] | ResolversTypes['Database'] | ResolversTypes['Documentation'] | ResolversTypes['Domain'] | ResolversTypes['Graphql'] | ResolversTypes['Grpc'] | ResolversTypes['Library'] | ResolversTypes['Openapi'] | ResolversTypes['Service'] | ResolversTypes['System'] | ResolversTypes['Website'];
  Owner: ResolversTypes['Department'] | ResolversTypes['Organization'] | ResolversTypes['SubDepartment'] | ResolversTypes['Team'] | ResolversTypes['User'];
  Query: ResolverTypeWrapper<{}>;
  Resource: ResolversTypes['Database'];
  Service: ResolverTypeWrapper<Omit<Service, 'dependencies' | 'owner'> & { dependencies?: Maybe<Array<Maybe<ResolversTypes['Dependency']>>>, owner: ResolversTypes['Owner'] }>;
  Step: ResolverTypeWrapper<Step>;
  String: ResolverTypeWrapper<Scalars['String']>;
  SubDepartment: ResolverTypeWrapper<Omit<SubDepartment, 'ownerOf'> & { ownerOf?: Maybe<Array<Maybe<ResolversTypes['Ownable']>>> }>;
  System: ResolverTypeWrapper<Omit<System, 'owner'> & { owner: ResolversTypes['Owner'] }>;
  Team: ResolverTypeWrapper<Omit<Team, 'ownerOf'> & { ownerOf?: Maybe<Array<Maybe<ResolversTypes['Ownable']>>> }>;
  Template: ResolversTypes['Documentation'] | ResolversTypes['Service'] | ResolversTypes['Website'];
  User: ResolverTypeWrapper<Omit<User, 'ownerOf'> & { ownerOf?: Maybe<Array<Maybe<ResolversTypes['Ownable']>>> }>;
  Website: ResolverTypeWrapper<Omit<Website, 'dependencies' | 'owner'> & { dependencies?: Maybe<Array<Maybe<ResolversTypes['Dependency']>>>, owner: ResolversTypes['Owner'] }>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  API: ResolversParentTypes['Asyncapi'] | ResolversParentTypes['Graphql'] | ResolversParentTypes['Grpc'] | ResolversParentTypes['Openapi'];
  Asyncapi: Omit<Asyncapi, 'owner'> & { owner: ResolversParentTypes['Owner'] };
  Boolean: Scalars['Boolean'];
  Component: ResolversParentTypes['Library'] | ResolversParentTypes['Service'] | ResolversParentTypes['Website'];
  Database: Omit<Database, 'dependencies' | 'dependents' | 'owner'> & { dependencies?: Maybe<Array<Maybe<ResolversParentTypes['Dependency']>>>, dependents?: Maybe<Array<Maybe<ResolversParentTypes['Dependency']>>>, owner: ResolversParentTypes['Owner'] };
  Department: Omit<Department, 'ownerOf'> & { ownerOf?: Maybe<Array<Maybe<ResolversParentTypes['Ownable']>>> };
  Dependency: ResolversParentTypes['Database'] | ResolversParentTypes['Library'] | ResolversParentTypes['Service'] | ResolversParentTypes['Website'];
  Documentation: Omit<Documentation, 'owner'> & { owner?: Maybe<ResolversParentTypes['Owner']> };
  Domain: Omit<Domain, 'owner'> & { owner: ResolversParentTypes['Owner'] };
  Entity: ResolversParentTypes['Asyncapi'] | ResolversParentTypes['Database'] | ResolversParentTypes['Department'] | ResolversParentTypes['Documentation'] | ResolversParentTypes['Domain'] | ResolversParentTypes['Graphql'] | ResolversParentTypes['Grpc'] | ResolversParentTypes['Library'] | ResolversParentTypes['Location'] | ResolversParentTypes['Openapi'] | ResolversParentTypes['Organization'] | ResolversParentTypes['Service'] | ResolversParentTypes['SubDepartment'] | ResolversParentTypes['System'] | ResolversParentTypes['Team'] | ResolversParentTypes['User'] | ResolversParentTypes['Website'];
  EntityLink: EntityLink;
  Graphql: Omit<Graphql, 'owner'> & { owner: ResolversParentTypes['Owner'] };
  Group: ResolversParentTypes['Department'] | ResolversParentTypes['Organization'] | ResolversParentTypes['SubDepartment'] | ResolversParentTypes['Team'];
  Grpc: Omit<Grpc, 'owner'> & { owner: ResolversParentTypes['Owner'] };
  ID: Scalars['ID'];
  JSON: Scalars['JSON'];
  JSONObject: Scalars['JSONObject'];
  Library: Omit<Library, 'dependencies' | 'owner'> & { dependencies?: Maybe<Array<Maybe<ResolversParentTypes['Dependency']>>>, owner: ResolversParentTypes['Owner'] };
  Location: Location;
  Never: Never;
  Node: ResolversParentTypes['Asyncapi'] | ResolversParentTypes['Database'] | ResolversParentTypes['Department'] | ResolversParentTypes['Documentation'] | ResolversParentTypes['Domain'] | ResolversParentTypes['Graphql'] | ResolversParentTypes['Grpc'] | ResolversParentTypes['Library'] | ResolversParentTypes['Location'] | ResolversParentTypes['Never'] | ResolversParentTypes['Openapi'] | ResolversParentTypes['Organization'] | ResolversParentTypes['Service'] | ResolversParentTypes['SubDepartment'] | ResolversParentTypes['System'] | ResolversParentTypes['Team'] | ResolversParentTypes['User'] | ResolversParentTypes['Website'];
  Openapi: Omit<Openapi, 'owner'> & { owner: ResolversParentTypes['Owner'] };
  Organization: Omit<Organization, 'ownerOf'> & { ownerOf?: Maybe<Array<Maybe<ResolversParentTypes['Ownable']>>> };
  Ownable: ResolversParentTypes['Asyncapi'] | ResolversParentTypes['Database'] | ResolversParentTypes['Documentation'] | ResolversParentTypes['Domain'] | ResolversParentTypes['Graphql'] | ResolversParentTypes['Grpc'] | ResolversParentTypes['Library'] | ResolversParentTypes['Openapi'] | ResolversParentTypes['Service'] | ResolversParentTypes['System'] | ResolversParentTypes['Website'];
  Owner: ResolversParentTypes['Department'] | ResolversParentTypes['Organization'] | ResolversParentTypes['SubDepartment'] | ResolversParentTypes['Team'] | ResolversParentTypes['User'];
  Query: {};
  Resource: ResolversParentTypes['Database'];
  Service: Omit<Service, 'dependencies' | 'owner'> & { dependencies?: Maybe<Array<Maybe<ResolversParentTypes['Dependency']>>>, owner: ResolversParentTypes['Owner'] };
  Step: Step;
  String: Scalars['String'];
  SubDepartment: Omit<SubDepartment, 'ownerOf'> & { ownerOf?: Maybe<Array<Maybe<ResolversParentTypes['Ownable']>>> };
  System: Omit<System, 'owner'> & { owner: ResolversParentTypes['Owner'] };
  Team: Omit<Team, 'ownerOf'> & { ownerOf?: Maybe<Array<Maybe<ResolversParentTypes['Ownable']>>> };
  Template: ResolversParentTypes['Documentation'] | ResolversParentTypes['Service'] | ResolversParentTypes['Website'];
  User: Omit<User, 'ownerOf'> & { ownerOf?: Maybe<Array<Maybe<ResolversParentTypes['Ownable']>>> };
  Website: Omit<Website, 'dependencies' | 'owner'> & { dependencies?: Maybe<Array<Maybe<ResolversParentTypes['Dependency']>>>, owner: ResolversParentTypes['Owner'] };
};

export type ApiResolvers<ContextType = any, ParentType extends ResolversParentTypes['API'] = ResolversParentTypes['API']> = {
  __resolveType: TypeResolveFn<'Asyncapi' | 'Graphql' | 'Grpc' | 'Openapi', ParentType, ContextType>;
  consumers?: Resolver<Maybe<Array<Maybe<ResolversTypes['Component']>>>, ParentType, ContextType>;
  definition?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  lifecycle?: Resolver<ResolversTypes['Lifecycle'], ParentType, ContextType>;
  owner?: Resolver<ResolversTypes['Owner'], ParentType, ContextType>;
  providers?: Resolver<Maybe<Array<Maybe<ResolversTypes['Component']>>>, ParentType, ContextType>;
  system?: Resolver<Maybe<ResolversTypes['System']>, ParentType, ContextType>;
};

export type AsyncapiResolvers<ContextType = any, ParentType extends ResolversParentTypes['Asyncapi'] = ResolversParentTypes['Asyncapi']> = {
  consumers?: Resolver<Maybe<Array<Maybe<ResolversTypes['Component']>>>, ParentType, ContextType>;
  definition?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lifecycle?: Resolver<ResolversTypes['Lifecycle'], ParentType, ContextType>;
  links?: Resolver<Maybe<Array<ResolversTypes['EntityLink']>>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  namespace?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  owner?: Resolver<ResolversTypes['Owner'], ParentType, ContextType>;
  providers?: Resolver<Maybe<Array<Maybe<ResolversTypes['Component']>>>, ParentType, ContextType>;
  system?: Resolver<Maybe<ResolversTypes['System']>, ParentType, ContextType>;
  tags?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ComponentResolvers<ContextType = any, ParentType extends ResolversParentTypes['Component'] = ResolversParentTypes['Component']> = {
  __resolveType: TypeResolveFn<'Library' | 'Service' | 'Website', ParentType, ContextType>;
  component?: Resolver<Maybe<ResolversTypes['Component']>, ParentType, ContextType>;
  consumesApi?: Resolver<Maybe<Array<Maybe<ResolversTypes['API']>>>, ParentType, ContextType>;
  dependencies?: Resolver<Maybe<Array<Maybe<ResolversTypes['Dependency']>>>, ParentType, ContextType>;
  lifecycle?: Resolver<ResolversTypes['Lifecycle'], ParentType, ContextType>;
  owner?: Resolver<ResolversTypes['Owner'], ParentType, ContextType>;
  providesApi?: Resolver<Maybe<Array<Maybe<ResolversTypes['API']>>>, ParentType, ContextType>;
  subComponents?: Resolver<Maybe<Array<Maybe<ResolversTypes['Component']>>>, ParentType, ContextType>;
  system?: Resolver<Maybe<ResolversTypes['System']>, ParentType, ContextType>;
};

export type DatabaseResolvers<ContextType = any, ParentType extends ResolversParentTypes['Database'] = ResolversParentTypes['Database']> = {
  dependencies?: Resolver<Maybe<Array<Maybe<ResolversTypes['Dependency']>>>, ParentType, ContextType>;
  dependents?: Resolver<Maybe<Array<Maybe<ResolversTypes['Dependency']>>>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  links?: Resolver<Maybe<Array<ResolversTypes['EntityLink']>>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  namespace?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  owner?: Resolver<ResolversTypes['Owner'], ParentType, ContextType>;
  systems?: Resolver<Maybe<Array<Maybe<ResolversTypes['System']>>>, ParentType, ContextType>;
  tags?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DepartmentResolvers<ContextType = any, ParentType extends ResolversParentTypes['Department'] = ResolversParentTypes['Department']> = {
  children?: Resolver<Array<Maybe<ResolversTypes['Group']>>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  displayName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  email?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  links?: Resolver<Maybe<Array<Maybe<ResolversTypes['EntityLink']>>>, ParentType, ContextType>;
  members?: Resolver<Maybe<Array<Maybe<ResolversTypes['User']>>>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  namespace?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  ownerOf?: Resolver<Maybe<Array<Maybe<ResolversTypes['Ownable']>>>, ParentType, ContextType>;
  parent?: Resolver<Maybe<ResolversTypes['Organization']>, ParentType, ContextType>;
  picture?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  tags?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DependencyResolvers<ContextType = any, ParentType extends ResolversParentTypes['Dependency'] = ResolversParentTypes['Dependency']> = {
  __resolveType: TypeResolveFn<'Database' | 'Library' | 'Service' | 'Website', ParentType, ContextType>;
};

export type DocumentationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Documentation'] = ResolversParentTypes['Documentation']> = {
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  links?: Resolver<Maybe<Array<ResolversTypes['EntityLink']>>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  namespace?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  output?: Resolver<Maybe<ResolversTypes['JSONObject']>, ParentType, ContextType>;
  owner?: Resolver<Maybe<ResolversTypes['Owner']>, ParentType, ContextType>;
  parameters?: Resolver<Maybe<ResolversTypes['JSONObject']>, ParentType, ContextType>;
  steps?: Resolver<Array<Maybe<ResolversTypes['Step']>>, ParentType, ContextType>;
  tags?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DomainResolvers<ContextType = any, ParentType extends ResolversParentTypes['Domain'] = ResolversParentTypes['Domain']> = {
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  links?: Resolver<Maybe<Array<Maybe<ResolversTypes['EntityLink']>>>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  namespace?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  owner?: Resolver<ResolversTypes['Owner'], ParentType, ContextType>;
  systems?: Resolver<Maybe<Array<Maybe<ResolversTypes['System']>>>, ParentType, ContextType>;
  tags?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type EntityResolvers<ContextType = any, ParentType extends ResolversParentTypes['Entity'] = ResolversParentTypes['Entity']> = {
  __resolveType: TypeResolveFn<'Asyncapi' | 'Database' | 'Department' | 'Documentation' | 'Domain' | 'Graphql' | 'Grpc' | 'Library' | 'Location' | 'Openapi' | 'Organization' | 'Service' | 'SubDepartment' | 'System' | 'Team' | 'User' | 'Website', ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  links?: Resolver<Maybe<Array<Maybe<ResolversTypes['EntityLink']>>>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  namespace?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  tags?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type EntityLinkResolvers<ContextType = any, ParentType extends ResolversParentTypes['EntityLink'] = ResolversParentTypes['EntityLink']> = {
  icon?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GraphqlResolvers<ContextType = any, ParentType extends ResolversParentTypes['Graphql'] = ResolversParentTypes['Graphql']> = {
  consumers?: Resolver<Maybe<Array<Maybe<ResolversTypes['Component']>>>, ParentType, ContextType>;
  definition?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lifecycle?: Resolver<ResolversTypes['Lifecycle'], ParentType, ContextType>;
  links?: Resolver<Maybe<Array<ResolversTypes['EntityLink']>>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  namespace?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  owner?: Resolver<ResolversTypes['Owner'], ParentType, ContextType>;
  providers?: Resolver<Maybe<Array<Maybe<ResolversTypes['Component']>>>, ParentType, ContextType>;
  system?: Resolver<Maybe<ResolversTypes['System']>, ParentType, ContextType>;
  tags?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GroupResolvers<ContextType = any, ParentType extends ResolversParentTypes['Group'] = ResolversParentTypes['Group']> = {
  __resolveType: TypeResolveFn<'Department' | 'Organization' | 'SubDepartment' | 'Team', ParentType, ContextType>;
  children?: Resolver<Array<Maybe<ResolversTypes['Group']>>, ParentType, ContextType>;
  displayName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  email?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  members?: Resolver<Maybe<Array<Maybe<ResolversTypes['User']>>>, ParentType, ContextType>;
  ownerOf?: Resolver<Maybe<Array<Maybe<ResolversTypes['Ownable']>>>, ParentType, ContextType>;
  parent?: Resolver<Maybe<ResolversTypes['Group']>, ParentType, ContextType>;
  picture?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type GrpcResolvers<ContextType = any, ParentType extends ResolversParentTypes['Grpc'] = ResolversParentTypes['Grpc']> = {
  consumers?: Resolver<Maybe<Array<Maybe<ResolversTypes['Component']>>>, ParentType, ContextType>;
  definition?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lifecycle?: Resolver<ResolversTypes['Lifecycle'], ParentType, ContextType>;
  links?: Resolver<Maybe<Array<ResolversTypes['EntityLink']>>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  namespace?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  owner?: Resolver<ResolversTypes['Owner'], ParentType, ContextType>;
  providers?: Resolver<Maybe<Array<Maybe<ResolversTypes['Component']>>>, ParentType, ContextType>;
  system?: Resolver<Maybe<ResolversTypes['System']>, ParentType, ContextType>;
  tags?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['JSON'], any> {
  name: 'JSON';
}

export interface JsonObjectScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['JSONObject'], any> {
  name: 'JSONObject';
}

export type LibraryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Library'] = ResolversParentTypes['Library']> = {
  component?: Resolver<Maybe<ResolversTypes['Component']>, ParentType, ContextType>;
  consumesApi?: Resolver<Maybe<Array<Maybe<ResolversTypes['API']>>>, ParentType, ContextType>;
  dependencies?: Resolver<Maybe<Array<Maybe<ResolversTypes['Dependency']>>>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lifecycle?: Resolver<ResolversTypes['Lifecycle'], ParentType, ContextType>;
  links?: Resolver<Maybe<Array<ResolversTypes['EntityLink']>>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  namespace?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  owner?: Resolver<ResolversTypes['Owner'], ParentType, ContextType>;
  providesApi?: Resolver<Maybe<Array<Maybe<ResolversTypes['API']>>>, ParentType, ContextType>;
  subComponents?: Resolver<Maybe<Array<Maybe<ResolversTypes['Component']>>>, ParentType, ContextType>;
  system?: Resolver<Maybe<ResolversTypes['System']>, ParentType, ContextType>;
  tags?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type LocationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Location'] = ResolversParentTypes['Location']> = {
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  links?: Resolver<Maybe<Array<ResolversTypes['EntityLink']>>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  namespace?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  tags?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  target?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  targets?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  type?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NeverResolvers<ContextType = any, ParentType extends ResolversParentTypes['Never'] = ResolversParentTypes['Never']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NodeResolvers<ContextType = any, ParentType extends ResolversParentTypes['Node'] = ResolversParentTypes['Node']> = {
  __resolveType: TypeResolveFn<'Asyncapi' | 'Database' | 'Department' | 'Documentation' | 'Domain' | 'Graphql' | 'Grpc' | 'Library' | 'Location' | 'Never' | 'Openapi' | 'Organization' | 'Service' | 'SubDepartment' | 'System' | 'Team' | 'User' | 'Website', ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
};

export type OpenapiResolvers<ContextType = any, ParentType extends ResolversParentTypes['Openapi'] = ResolversParentTypes['Openapi']> = {
  consumers?: Resolver<Maybe<Array<Maybe<ResolversTypes['Component']>>>, ParentType, ContextType>;
  definition?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lifecycle?: Resolver<ResolversTypes['Lifecycle'], ParentType, ContextType>;
  links?: Resolver<Maybe<Array<ResolversTypes['EntityLink']>>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  namespace?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  owner?: Resolver<ResolversTypes['Owner'], ParentType, ContextType>;
  providers?: Resolver<Maybe<Array<Maybe<ResolversTypes['Component']>>>, ParentType, ContextType>;
  system?: Resolver<Maybe<ResolversTypes['System']>, ParentType, ContextType>;
  tags?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type OrganizationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Organization'] = ResolversParentTypes['Organization']> = {
  children?: Resolver<Array<Maybe<ResolversTypes['Group']>>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  displayName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  email?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  links?: Resolver<Maybe<Array<Maybe<ResolversTypes['EntityLink']>>>, ParentType, ContextType>;
  members?: Resolver<Maybe<Array<Maybe<ResolversTypes['User']>>>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  namespace?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  ownerOf?: Resolver<Maybe<Array<Maybe<ResolversTypes['Ownable']>>>, ParentType, ContextType>;
  parent?: Resolver<Maybe<ResolversTypes['Group']>, ParentType, ContextType>;
  picture?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  tags?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type OwnableResolvers<ContextType = any, ParentType extends ResolversParentTypes['Ownable'] = ResolversParentTypes['Ownable']> = {
  __resolveType: TypeResolveFn<'Asyncapi' | 'Database' | 'Documentation' | 'Domain' | 'Graphql' | 'Grpc' | 'Library' | 'Openapi' | 'Service' | 'System' | 'Website', ParentType, ContextType>;
};

export type OwnerResolvers<ContextType = any, ParentType extends ResolversParentTypes['Owner'] = ResolversParentTypes['Owner']> = {
  __resolveType: TypeResolveFn<'Department' | 'Organization' | 'SubDepartment' | 'Team' | 'User', ParentType, ContextType>;
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  entity?: Resolver<Maybe<ResolversTypes['Entity']>, ParentType, ContextType, RequireFields<QueryEntityArgs, 'kind' | 'name'>>;
  node?: Resolver<Maybe<ResolversTypes['Node']>, ParentType, ContextType, RequireFields<QueryNodeArgs, 'id'>>;
};

export type ResourceResolvers<ContextType = any, ParentType extends ResolversParentTypes['Resource'] = ResolversParentTypes['Resource']> = {
  __resolveType: TypeResolveFn<'Database', ParentType, ContextType>;
  dependencies?: Resolver<Maybe<Array<Maybe<ResolversTypes['Dependency']>>>, ParentType, ContextType>;
  dependents?: Resolver<Maybe<Array<Maybe<ResolversTypes['Dependency']>>>, ParentType, ContextType>;
  owner?: Resolver<ResolversTypes['Owner'], ParentType, ContextType>;
  systems?: Resolver<Maybe<Array<Maybe<ResolversTypes['System']>>>, ParentType, ContextType>;
};

export type ServiceResolvers<ContextType = any, ParentType extends ResolversParentTypes['Service'] = ResolversParentTypes['Service']> = {
  component?: Resolver<Maybe<ResolversTypes['Component']>, ParentType, ContextType>;
  consumesApi?: Resolver<Maybe<Array<Maybe<ResolversTypes['API']>>>, ParentType, ContextType>;
  dependencies?: Resolver<Maybe<Array<Maybe<ResolversTypes['Dependency']>>>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lifecycle?: Resolver<ResolversTypes['Lifecycle'], ParentType, ContextType>;
  links?: Resolver<Maybe<Array<ResolversTypes['EntityLink']>>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  namespace?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  output?: Resolver<Maybe<ResolversTypes['JSONObject']>, ParentType, ContextType>;
  owner?: Resolver<ResolversTypes['Owner'], ParentType, ContextType>;
  parameters?: Resolver<Maybe<ResolversTypes['JSONObject']>, ParentType, ContextType>;
  providesApi?: Resolver<Maybe<Array<Maybe<ResolversTypes['API']>>>, ParentType, ContextType>;
  steps?: Resolver<Array<Maybe<ResolversTypes['Step']>>, ParentType, ContextType>;
  subComponents?: Resolver<Maybe<Array<Maybe<ResolversTypes['Component']>>>, ParentType, ContextType>;
  system?: Resolver<Maybe<ResolversTypes['System']>, ParentType, ContextType>;
  tags?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type StepResolvers<ContextType = any, ParentType extends ResolversParentTypes['Step'] = ResolversParentTypes['Step']> = {
  action?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  if?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  input?: Resolver<Maybe<ResolversTypes['JSONObject']>, ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SubDepartmentResolvers<ContextType = any, ParentType extends ResolversParentTypes['SubDepartment'] = ResolversParentTypes['SubDepartment']> = {
  children?: Resolver<Array<Maybe<ResolversTypes['Group']>>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  displayName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  email?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  links?: Resolver<Maybe<Array<Maybe<ResolversTypes['EntityLink']>>>, ParentType, ContextType>;
  members?: Resolver<Maybe<Array<Maybe<ResolversTypes['User']>>>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  namespace?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  ownerOf?: Resolver<Maybe<Array<Maybe<ResolversTypes['Ownable']>>>, ParentType, ContextType>;
  parent?: Resolver<Maybe<ResolversTypes['Department']>, ParentType, ContextType>;
  picture?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  tags?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SystemResolvers<ContextType = any, ParentType extends ResolversParentTypes['System'] = ResolversParentTypes['System']> = {
  components?: Resolver<Maybe<Array<Maybe<ResolversTypes['Component']>>>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  domain?: Resolver<Maybe<ResolversTypes['Domain']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  links?: Resolver<Maybe<Array<Maybe<ResolversTypes['EntityLink']>>>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  namespace?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  owner?: Resolver<ResolversTypes['Owner'], ParentType, ContextType>;
  resources?: Resolver<Maybe<Array<Maybe<ResolversTypes['Resource']>>>, ParentType, ContextType>;
  tags?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TeamResolvers<ContextType = any, ParentType extends ResolversParentTypes['Team'] = ResolversParentTypes['Team']> = {
  children?: Resolver<Array<Maybe<ResolversTypes['Group']>>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  displayName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  email?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  links?: Resolver<Maybe<Array<Maybe<ResolversTypes['EntityLink']>>>, ParentType, ContextType>;
  members?: Resolver<Maybe<Array<Maybe<ResolversTypes['User']>>>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  namespace?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  ownerOf?: Resolver<Maybe<Array<Maybe<ResolversTypes['Ownable']>>>, ParentType, ContextType>;
  parent?: Resolver<Maybe<ResolversTypes['SubDepartment']>, ParentType, ContextType>;
  picture?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  tags?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TemplateResolvers<ContextType = any, ParentType extends ResolversParentTypes['Template'] = ResolversParentTypes['Template']> = {
  __resolveType: TypeResolveFn<'Documentation' | 'Service' | 'Website', ParentType, ContextType>;
  output?: Resolver<Maybe<ResolversTypes['JSONObject']>, ParentType, ContextType>;
  owner?: Resolver<Maybe<ResolversTypes['Owner']>, ParentType, ContextType>;
  parameters?: Resolver<Maybe<ResolversTypes['JSONObject']>, ParentType, ContextType>;
  steps?: Resolver<Array<Maybe<ResolversTypes['Step']>>, ParentType, ContextType>;
};

export type UserResolvers<ContextType = any, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = {
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  displayName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  email?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  links?: Resolver<Maybe<Array<Maybe<ResolversTypes['EntityLink']>>>, ParentType, ContextType>;
  memberOf?: Resolver<Array<Maybe<ResolversTypes['Group']>>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  namespace?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  ownerOf?: Resolver<Maybe<Array<Maybe<ResolversTypes['Ownable']>>>, ParentType, ContextType>;
  picture?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  tags?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type WebsiteResolvers<ContextType = any, ParentType extends ResolversParentTypes['Website'] = ResolversParentTypes['Website']> = {
  component?: Resolver<Maybe<ResolversTypes['Component']>, ParentType, ContextType>;
  consumesApi?: Resolver<Maybe<Array<Maybe<ResolversTypes['API']>>>, ParentType, ContextType>;
  dependencies?: Resolver<Maybe<Array<Maybe<ResolversTypes['Dependency']>>>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lifecycle?: Resolver<ResolversTypes['Lifecycle'], ParentType, ContextType>;
  links?: Resolver<Maybe<Array<ResolversTypes['EntityLink']>>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  namespace?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  output?: Resolver<Maybe<ResolversTypes['JSONObject']>, ParentType, ContextType>;
  owner?: Resolver<ResolversTypes['Owner'], ParentType, ContextType>;
  parameters?: Resolver<Maybe<ResolversTypes['JSONObject']>, ParentType, ContextType>;
  providesApi?: Resolver<Maybe<Array<Maybe<ResolversTypes['API']>>>, ParentType, ContextType>;
  steps?: Resolver<Array<Maybe<ResolversTypes['Step']>>, ParentType, ContextType>;
  subComponents?: Resolver<Maybe<Array<Maybe<ResolversTypes['Component']>>>, ParentType, ContextType>;
  system?: Resolver<Maybe<ResolversTypes['System']>, ParentType, ContextType>;
  tags?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = any> = {
  API?: ApiResolvers<ContextType>;
  Asyncapi?: AsyncapiResolvers<ContextType>;
  Component?: ComponentResolvers<ContextType>;
  Database?: DatabaseResolvers<ContextType>;
  Department?: DepartmentResolvers<ContextType>;
  Dependency?: DependencyResolvers<ContextType>;
  Documentation?: DocumentationResolvers<ContextType>;
  Domain?: DomainResolvers<ContextType>;
  Entity?: EntityResolvers<ContextType>;
  EntityLink?: EntityLinkResolvers<ContextType>;
  Graphql?: GraphqlResolvers<ContextType>;
  Group?: GroupResolvers<ContextType>;
  Grpc?: GrpcResolvers<ContextType>;
  JSON?: GraphQLScalarType;
  JSONObject?: GraphQLScalarType;
  Library?: LibraryResolvers<ContextType>;
  Location?: LocationResolvers<ContextType>;
  Never?: NeverResolvers<ContextType>;
  Node?: NodeResolvers<ContextType>;
  Openapi?: OpenapiResolvers<ContextType>;
  Organization?: OrganizationResolvers<ContextType>;
  Ownable?: OwnableResolvers<ContextType>;
  Owner?: OwnerResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Resource?: ResourceResolvers<ContextType>;
  Service?: ServiceResolvers<ContextType>;
  Step?: StepResolvers<ContextType>;
  SubDepartment?: SubDepartmentResolvers<ContextType>;
  System?: SystemResolvers<ContextType>;
  Team?: TeamResolvers<ContextType>;
  Template?: TemplateResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
  Website?: WebsiteResolvers<ContextType>;
};


export type Json = Scalars["JSON"];
export type JsonObject = Scalars["JSONObject"];