/* eslint-disable */
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export interface Scalars {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
}

export interface Api {
  __typename?: 'API';
  consumedBy: Maybe<Array<Maybe<Component>>>;
  description: Scalars['String'];
  name: Scalars['String'];
  providedBy: Component;
}

export interface Component {
  __typename?: 'Component';
  consumes: Maybe<Array<Maybe<Api>>>;
  dependencies: Maybe<Array<Maybe<Resource>>>;
  description: Scalars['String'];
  lifecycle: Scalars['String'];
  name: Scalars['String'];
  owner: Group;
  partOf: Maybe<Array<Maybe<Container>>>;
  provides: Maybe<Array<Maybe<Api>>>;
  subComponents: Maybe<Array<Maybe<Component>>>;
  type: Scalars['String'];
}

export type Container = Component | System;

export interface Domain {
  __typename?: 'Domain';
  description: Scalars['String'];
  links: Array<Link>;
  name: Scalars['String'];
  owner: Group;
  tags: Array<Scalars['String']>;
}

export interface Group {
  __typename?: 'Group';
  department: Scalars['String'];
  description: Scalars['String'];
  displayName: Scalars['String'];
  email: Scalars['String'];
  name: Scalars['String'];
  picture: Scalars['String'];
}

export interface Link {
  __typename?: 'Link';
  title: Scalars['String'];
  url: Scalars['String'];
}

export interface Resource {
  __typename?: 'Resource';
  name: Scalars['String'];
}

export interface System {
  __typename?: 'System';
  description: Scalars['String'];
  displayName: Scalars['String'];
  name: Scalars['String'];
}

export interface User {
  __typename?: 'User';
  displayName: Scalars['String'];
  email: Scalars['String'];
  name: Scalars['String'];
  picture: Scalars['String'];
}
