import { ANNOTATION_LOCATION, ANNOTATION_ORIGIN_LOCATION, DEFAULT_NAMESPACE, stringifyEntityRef } from "@backstage/catalog-model";
import { Config } from "@backstage/config";
import { DefaultGithubCredentialsProvider, GitHubIntegration, ScmIntegrations } from '@backstage/integration';
import type { EntityIteratorResult, IncrementalEntityProvider } from "@frontside/backstage-plugin-incremental-ingestion-backend";
import { Octokit } from '@octokit/rest';
import assert from 'assert-ts';
import slugify from 'slugify';
import { RepositoryPrivacy } from "../__generated__/types";
import type { OrganizationRepositoriesQuery } from "./repository-entity-provider.__generated__";
import parseLinkHeader from 'parse-link-header';
import { Logger } from "winston";

const ORGANIZATION_REPOSITORIES_QUERY = /* GraphQL */`
  query OrganizationRepositories($organization: String!, $privacy: RepositoryPrivacy, $cursor: String) {
    organization(login: $organization) {
      repositories(first: 100, privacy: $privacy, after: $cursor) {
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
  logger: Logger;
  config: Config;
  host: string;
  organizations?: string[];
  privacy?: RepositoryPrivacy;
}

interface Context {
  octokit: Octokit;
  url: string;
}

interface Cursor {
  /**
   * Cursor used to paginate repositories
   */
  cursor: string | null;
  /**
   * Organiation id used to fetch next organization
   */
  since?: number;

  /**
   * Current organization login
   */
  organization?: string;

  /**
   * Are there more orgs to process?
   */
  hasMoreOrgs: boolean;
}

interface GithubRepositoryEntityProviderConstructorOptions {
  credentialsProvider: DefaultGithubCredentialsProvider;
  host: string;
  integration: GitHubIntegration;
  organizations?: string[];
  privacy?: RepositoryPrivacy;
  logger: Logger;
}

export class GithubRepositoryEntityProvider implements IncrementalEntityProvider<Cursor, Context> {
  private host: string;
  private credentialsProvider: DefaultGithubCredentialsProvider;
  private integration: GitHubIntegration;
  private logger: Logger;
  private organizations?: string[];
  private privacy?: RepositoryPrivacy;

  static create({ host, config, organizations, logger, privacy = RepositoryPrivacy.Public }: GithubRepositoryEntityProviderOptions) {
    const integrations = ScmIntegrations.fromConfig(config);
    const credentialsProvider = DefaultGithubCredentialsProvider.fromIntegrations(integrations);
    const integration = integrations.github.byHost(host);

    assert(integration !== undefined, `Missing Github integration for ${host}`);

    return new GithubRepositoryEntityProvider({ credentialsProvider, host, integration, organizations, privacy, logger });
  }

  private constructor(options: GithubRepositoryEntityProviderConstructorOptions) {
    this.credentialsProvider = options.credentialsProvider;
    this.host = options.host;
    this.integration = options.integration;
    this.organizations = options.organizations;
    this.privacy = options.privacy;
    this.logger = options.logger;
  }

  getProviderName() {
    return `GithubRepository:${this.host}`;
  }

  async around(burst: (context: Context) => Promise<void>) {

    const url = `https://${this.host}`;

    const { token } = await this.credentialsProvider.getCredentials({
      url,
    });

    const octokit = new Octokit({
      baseUrl: this.integration.config.apiBaseUrl,
      auth: token,
    });

    await burst({ octokit, url })
  }

  async next({ url, octokit }: Context, cursor: Cursor = { cursor: null, hasMoreOrgs: false }): Promise<EntityIteratorResult<Cursor>> {

    const since = cursor.since ?? 0;
    let hasMoreOrgs = cursor.hasMoreOrgs ?? false;

    let organization: { login: string, id: number };

    if (cursor.organization && cursor.cursor !== null) {
      organization = {
        login: cursor.organization,
        id: since
      }
    } else {
      if (this.organizations) {
        // array of organizations was passed to entity provider
        // treat index in array as id
        organization = {
          login: this.organizations[since],
          id: since + 1
        }
        hasMoreOrgs = organization.id < this.organizations.length;
      } else {
        const response = await octokit.request('GET /organizations', {
          since,
          per_page: 1
        });
        [organization] = response.data;
        const link = parseLinkHeader(response.headers.link);
        this.logger.debug(`LINK: ${JSON.stringify(link)}`);
        if (link) {
          hasMoreOrgs = !!link.next;
        }
      }
    }

    this.logger.info(`Current organization`, { login: organization.login, id: organization.id, hasMoreOrgs});

    if (!organization) {
      return {
        done: true,
        cursor: { cursor: null },
        entities: []
      }
    }

    const data = await octokit.graphql<OrganizationRepositoriesQuery>(ORGANIZATION_REPOSITORIES_QUERY,
      {
        organization: organization.login,
        cursor: cursor.cursor,
        privacy: this.privacy
      }
    );

    const location = `url:${url}`;

    const entities = data.organization?.repositories.nodes?.flatMap(node => node?.__typename === 'Repository' ? [node] : [])
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
      })) ?? [];

    if (data.organization?.repositories.pageInfo.hasNextPage) {
      const _cursor = {
        cursor: data.organization?.repositories.pageInfo.endCursor ?? null,
        since: organization.id,
        organization: organization.login,
        hasMoreOrgs
      }
      this.logger.debug("Has more repositories", _cursor);
      return {
        done: false,
        cursor: _cursor,
        entities,
      }
    }
    
    if (hasMoreOrgs) {
      const _cursor = {
        cursor: null,
        since: organization.id,
        hasMoreOrgs
      };
      this.logger.debug("Has no more repositories but has more orgs", _cursor);
      return {
        done: false,
        cursor: _cursor,
        entities
      }
    }

    return {
      done: true,
      cursor: { cursor: null },
      entities,
    }
  }
}

function normalizeEntityName(name: string = '') {
  return slugify(name.replace('/', '__').replace('.', '__dot__'))
}