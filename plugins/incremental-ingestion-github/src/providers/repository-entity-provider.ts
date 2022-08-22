import { ANNOTATION_LOCATION, ANNOTATION_ORIGIN_LOCATION, DEFAULT_NAMESPACE, stringifyEntityRef } from "@backstage/catalog-model";
import { GithubCredentialsProvider, GitHubIntegrationConfig } from '@backstage/integration';
import { IncrementalEntityProvider } from "@frontside/backstage-plugin-incremental-ingestion-backend";
import { graphql } from '@octokit/graphql';
import slugify from 'slugify';
import type { RepositorySearchQuery } from "./repository-entity-provider.__generated__";

interface GithubRepositoryEntityProviderContext {
  client: typeof graphql
}

interface Options {
  id: string;
  credentialsProvider: GithubCredentialsProvider;
  integration: GitHubIntegrationConfig
}

export function createGithubRepositoryEntityProvider({
  id,
  credentialsProvider,
  integration
}: Options): IncrementalEntityProvider<string, GithubRepositoryEntityProviderContext> {

  return {
    getProviderName() {
      return `incremental-entity-provider:github-repository:${id}`
    },
    async around(burst) {
      const { headers } = await credentialsProvider.getCredentials({
        url: integration.host,
      });

      const client = graphql.defaults({
        baseUrl: integration.apiBaseUrl,
        headers,
      });

      await burst({ client })
    },
    async next(context, cursor) {

      const data = await context.client<RepositorySearchQuery>(/* GraphQL */`
        query RepositorySearch($cursor: String!) {
          search(
            query: "created:>1970-01-01"
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
        }`,
        { cursor }
      )

      const location = `url:https://${integration.host}`;

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
        cursor: data.search.pageInfo.endCursor ?? '',
        entities: entities ?? []
      }
    }
  }
}

function normalizeEntityName(name: string) {
  return slugify(name, { replacement: '__', trim: true, lower: true })
}