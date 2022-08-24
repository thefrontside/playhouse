import { ANNOTATION_LOCATION, ANNOTATION_ORIGIN_LOCATION, DEFAULT_NAMESPACE, stringifyEntityRef } from "@backstage/catalog-model";
import { GithubCredentialsProvider, GitHubIntegration } from '@backstage/integration';
import { IncrementalEntityProvider } from "@frontside/backstage-plugin-incremental-ingestion-backend";
import { graphql } from '@octokit/graphql';
import slugify from 'slugify';
import { Logger } from "winston";
import type { RepositorySearchQuery } from "./repository-entity-provider.__generated__";

interface GithubRepositoryEntityProviderContext {
  client: typeof graphql;
  url: string;
}

interface Options {
  id: string;
  searchQuery?: string;
  credentialsProvider: GithubCredentialsProvider;
  integration: GitHubIntegration;
  logger: Logger
}

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

export function createGithubRepositoryEntityProvider({
  id,
  credentialsProvider,
  integration,
  searchQuery = "created:>1970-01-01",
}: Options): IncrementalEntityProvider<string, GithubRepositoryEntityProviderContext> {

  return {
    getProviderName() {
      return `GithubRepositoryEntityProvider:${id}`
    },
    async around(burst) {
      const url = `https://${integration.config.host}`;

      const { headers } = await credentialsProvider.getCredentials({
        url,
      });

      const client = graphql.defaults({
        baseUrl: integration.config.apiBaseUrl,
        headers,
      });

      await burst({ client, url })
    },
    async next({ client, url }, cursor) {

      const data = await client<RepositorySearchQuery>(REPOSITORY_SEARCH_QUERY,
        { 
          cursor: cursor || null,
          searchQuery,
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
              name: slugify(node.nameWithOwner),
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
        cursor: JSON.stringify(data.search.pageInfo.endCursor),
        entities: entities ?? []
      };
    }
  }
}