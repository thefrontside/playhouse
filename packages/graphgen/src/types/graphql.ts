/* eslint-disable */
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export interface Scalars {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
}

export interface Api {
  __typename?: 'API';
  consumedBy: Maybe<Array<Maybe<Component>>>;
  description: Scalars['String']['output'];
  name: Scalars['String']['output'];
  providedBy: Component;
}

export interface Component {
  __typename?: 'Component';
  consumes: Maybe<Array<Maybe<Api>>>;
  dependencies: Maybe<Array<Maybe<Resource>>>;
  description: Scalars['String']['output'];
  lifecycle: Scalars['String']['output'];
  name: Scalars['String']['output'];
  owner: Group;
  partOf: Maybe<Array<Maybe<Container>>>;
  provides: Maybe<Array<Maybe<Api>>>;
  subComponents: Maybe<Array<Maybe<Component>>>;
  type: Scalars['String']['output'];
}

export type Container = Component | System;

export interface Domain {
  __typename?: 'Domain';
  description: Scalars['String']['output'];
  links: Array<Link>;
  name: Scalars['String']['output'];
  owner: Group;
  tags: Array<Scalars['String']['output']>;
}

export interface Group {
  __typename?: 'Group';
  department: Scalars['String']['output'];
  description: Scalars['String']['output'];
  displayName: Scalars['String']['output'];
  email: Scalars['String']['output'];
  name: Scalars['String']['output'];
  picture: Scalars['String']['output'];
}

export interface Link {
  __typename?: 'Link';
  title: Scalars['String']['output'];
  url: Scalars['String']['output'];
}

export interface Resource {
  __typename?: 'Resource';
  name: Scalars['String']['output'];
}

export interface System {
  __typename?: 'System';
  description: Scalars['String']['output'];
  displayName: Scalars['String']['output'];
  name: Scalars['String']['output'];
}

export interface User {
  __typename?: 'User';
  displayName: Scalars['String']['output'];
  email: Scalars['String']['output'];
  name: Scalars['String']['output'];
  picture: Scalars['String']['output'];
}
