import {
  ANNOTATION_LOCATION,
  ANNOTATION_ORIGIN_LOCATION,
  DEFAULT_NAMESPACE,
  Entity,
  stringifyEntityRef,
} from '@backstage/catalog-model';
import {
  DefaultGithubCredentialsProvider,
  GithubIntegration,
  ScmIntegrations,
} from '@backstage/integration';
import type {
  EntityIteratorResult,
  IncrementalEntityProvider,
} from '@backstage/plugin-catalog-backend-module-incremental-ingestion';
import { graphql } from '@octokit/graphql';
import assert from 'assert-ts';
import slugify from 'slugify';
import type { OrganizationRepositoriesQuery } from './query.__generated__';
import {
  type GithubRepositoryEntityProviderConstructorOptions,
  type Context,
  type Cursor,
  type GithubRepositoryEntityProviderOptions,
  type RepositoryMapper,
  type OrganizationMapper,
} from '../types';
import { ORGANIZATION_REPOSITORIES_QUERY } from './query';
import { defaultOrganizationMapper, defaultRepositoryMapper } from './mappers';
import { DeferredEntity } from '@backstage/plugin-catalog-node';

export class GithubRepositoryEntityProvider
  implements IncrementalEntityProvider<Cursor, Context>
{
  private readonly host: string;
  private readonly credentialsProvider: DefaultGithubCredentialsProvider;
  private readonly integration: GithubIntegration;
  private readonly repositoryMapper: RepositoryMapper;
  private readonly organizationMapper: OrganizationMapper;

  static create({ host, config }: GithubRepositoryEntityProviderOptions) {
    const integrations = ScmIntegrations.fromConfig(config);
    const credentialsProvider =
      DefaultGithubCredentialsProvider.fromIntegrations(integrations);
    const integration = integrations.github.byHost(host);

    assert(integration !== undefined, `Missing Github integration for ${host}`);

    return new GithubRepositoryEntityProvider({
      credentialsProvider,
      host,
      integration,
    });
  }

  private constructor(
    options: GithubRepositoryEntityProviderConstructorOptions,
  ) {
    this.host = options.host;
    this.credentialsProvider = options.credentialsProvider;
    this.integration = options.integration;
    this.organizationMapper = options.organizationMapper ?? defaultOrganizationMapper;
    this.repositoryMapper = options.repositoryMapper ?? defaultRepositoryMapper;
  }

  getProviderName() {
    return `GithubRepository:${this.host}`;
  }

  async around(burst: (context: Context) => Promise<void>) {
    const url = `https://${this.host}`;

    const { headers } = await this.credentialsProvider.getCredentials({
      url,
    });

    const client = graphql.defaults({
      baseUrl: this.integration.config.apiBaseUrl,
      headers,
    });

    await burst({ client, url });
  }

  async next(
    { client }: Context,
    cursor: Cursor,
  ): Promise<EntityIteratorResult<Cursor>> {
    let orgCursor = cursor?.orgCursor || null;
    let repoCursor = cursor?.repoCursor || null;

    const data = await client<OrganizationRepositoriesQuery>(
      ORGANIZATION_REPOSITORIES_QUERY,
      {
        orgCursor,
        repoCursor,
      },
    );

    const deferred: DeferredEntity[] = [];

    const [ organization ] = data.viewer.organizations.nodes ?? [];

    // only call org mapper for first page of repositories
    if (repoCursor === null && organization) {
      deferred.push(...this.organizationMapper(organization));
    }

    for (const repository of organization?.repositories.nodes || []) {
      if (repository) {
        deferred.push(...this.repositoryMapper(repository));
      }
    }

    let done = false;
    if (!organization?.repositories.pageInfo.hasNextPage && !data.viewer.organizations.pageInfo.hasNextPage) {
      // last page of repositories and no more organizations
      done = true;
    } else if (organization?.repositories.pageInfo.hasNextPage) {
      // current organization still has repositories
      repoCursor = organization?.repositories.pageInfo.endCursor ?? null;
    } else if (data.viewer.organizations.pageInfo.hasNextPage) {
      // start next org on the next cycle
      repoCursor = null;
      orgCursor = data.viewer.organizations.pageInfo.endCursor ?? null;
    }

    return {
      done,
      cursor: { repoCursor, orgCursor },
      entities: deferred,
    };
  }
}

function normalizeEntityName(name: string = '') {
  return slugify(name.replace('/', '__').replace('.', '__dot__'));
}
