import { ANNOTATION_LOCATION, ANNOTATION_ORIGIN_LOCATION, DEFAULT_NAMESPACE, stringifyEntityRef } from "@backstage/catalog-model";
import { Config } from "@backstage/config";
import { DefaultGithubCredentialsProvider, GithubIntegration, ScmIntegrations } from '@backstage/integration';
import type { EntityIteratorResult, IncrementalEntityProvider } from "@frontside/backstage-plugin-incremental-ingestion-backend";
import { graphql } from '@octokit/graphql';
import assert from 'assert-ts';
import slugify from 'slugify';
import type { RepositorySearchQuery } from "./repository-entity-provider.__generated__";

const REPOSITORY_SEARCH_QUERY = /* GraphQL */`
  query RepositorySearch($searchQuery: String!, $cursor: String) {
    search(
      query: $searchQuery
      type: REPOSITORY
      first: 100
      after: $cursor
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        ... on Repository {
          __typename
          id
          isArchived
          name
          nameWithOwner
          url
          description
          visibility
          languages(first: 10) {
            nodes {
              name
            }
          }
          repositoryTopics(first: 10) {
            nodes {
              topic {
                name
              }
            }
          }
          owner {
            ... on Organization {
              __typename
              login
            }
            ... on User {
              __typename
              login
            }
          }
        }
      }
    }
    rateLimit {
      cost
      remaining
      used
      limit
    }
  }
`;

interface GithubRepositoryEntityProviderOptions {
  host: string;
  config: Config;
  searchQuery: string;
}

interface Context {
  client: typeof graphql;
  url: string;
}

interface Cursor {
  cursor: string | null;
}

interface GithubRepositoryEntityProviderConstructorOptions {
  credentialsProvider: DefaultGithubCredentialsProvider;
  host: string;
  integration: GithubIntegration;
  searchQuery: string;
}

export class GithubRepositoryEntityProvider implements IncrementalEntityProvider<Cursor, Context> {
  private host: string;
  private credentialsProvider: DefaultGithubCredentialsProvider;
  private integration: GithubIntegration;
  private searchQuery: string;

  static create({ host, config, searchQuery = "created:>1970-01-01" }: GithubRepositoryEntityProviderOptions) {
    const integrations = ScmIntegrations.fromConfig(config);
    const credentialsProvider = DefaultGithubCredentialsProvider.fromIntegrations(integrations);
    const integration = integrations.github.byHost(host);

    assert(integration !== undefined, `Missing Github integration for ${host}`);

    return new GithubRepositoryEntityProvider({ credentialsProvider, host, integration, searchQuery })
  }

  private constructor(options: GithubRepositoryEntityProviderConstructorOptions) {
    this.credentialsProvider = options.credentialsProvider;
    this.host = options.host;
    this.integration = options.integration;
    this.searchQuery = options.searchQuery;
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

    await burst({ client, url })
  }

  async next({ client, url }: Context, { cursor }: Cursor = { cursor: null }): Promise<EntityIteratorResult<Cursor>> {

    const data = await client<RepositorySearchQuery>(REPOSITORY_SEARCH_QUERY,
      {
        cursor,
        searchQuery: this.searchQuery,
      }
    );

    const location = `url:${url}`;

    const entities = data.search.nodes?.flatMap(node => node?.__typename === 'Repository' ? [node] : [])
      .map(node => ({
        entity: {
          apiVersion: 'backstage.io/v1beta1',
          kind: 'GithubRepository',
          metadata: {
            namespace: DEFAULT_NAMESPACE,
            name: normalizeEntityName(node.nameWithOwner),
            description: node.description ?? '',
            annotations: {
              [ANNOTATION_LOCATION]: location,
              [ANNOTATION_ORIGIN_LOCATION]: location,
            },
          },
          spec: {
            url: node.url,
            owner: stringifyEntityRef({
              kind: `Github${node.owner.__typename}`,
              namespace: DEFAULT_NAMESPACE,
              name: node.owner.login
            }),
            nameWithOwner: node.nameWithOwner,
            languages: node.languages?.nodes?.flatMap(_node => _node?.__typename === 'Language' ? [_node] : []).map(_node => _node.name) ?? [],
            topics: node.repositoryTopics?.nodes?.flatMap(_node => _node?.__typename === 'RepositoryTopic' ? [_node] : []).map(_node => _node.topic.name) ?? [],
            visibility: node.visibility,
          },
        },
        locationKey: this.getProviderName(),
      }));

    return {
      done: !data.search.pageInfo.hasNextPage,
      cursor: { cursor: data.search.pageInfo.endCursor ?? null },
      entities: entities ?? []
    };
  }
}

function normalizeEntityName(name: string = '') {
  return slugify(name.replace('/', '__').replace('.', '__dot__'))
}
