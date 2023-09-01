import { Config } from '@backstage/config';
import { graphql } from '@octokit/graphql';
import {
  DefaultGithubCredentialsProvider,
  GithubIntegration,
} from '@backstage/integration';
import { OrganizationFragment, RepositoryFragment } from './providers/query.__generated__';
import { type DeferredEntity } from '@backstage/plugin-catalog-node';

export interface GithubRepositoryEntityProviderOptions {
  host: string;
  config: Config;
  organizationMapper?: OrganizationMapper;
  repositoryMapper?: RepositoryMapper
}

export interface Context {
  client: typeof graphql;
  url: string;
}

export interface Cursor {
  orgCursor: string | null;
  repoCursor: string | null;
}

export interface GithubRepositoryEntityProviderConstructorOptions {
  credentialsProvider: DefaultGithubCredentialsProvider;
  host: string;
  integration: GithubIntegration;
  organizationMapper?: OrganizationMapper;
  repositoryMapper?: RepositoryMapper
}

export type OrganizationMapper = (org: OrganizationFragment) => DeferredEntity[]
export type RepositoryMapper = (repo: RepositoryFragment) => DeferredEntity[]