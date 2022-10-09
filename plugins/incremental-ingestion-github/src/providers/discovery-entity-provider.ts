import { ANNOTATION_LOCATION, ANNOTATION_ORIGIN_LOCATION } from '@backstage/catalog-model';
import { Config } from '@backstage/config';
import {
  DefaultGithubCredentialsProvider,
  GitHubIntegration,
  ScmIntegrations
} from '@backstage/integration';
import { CatalogProcessorResult, DeferredEntity, parseEntityYaml } from '@backstage/plugin-catalog-backend';
import type {
  EntityIteratorResult,
  IncrementalEntityProvider
} from '@frontside/backstage-plugin-incremental-ingestion-backend';
import { Octokit } from '@octokit/rest';
import assert from 'assert-ts';
import { Logger } from 'winston';
import type { OrganizationRepositoriesQuery } from './discovery-entity-provider.__generated__';

interface Context {
  octokit: Octokit;
  url: string;
}

interface Cursor {
  /**
   * Current organization login
   */
  login?: string;

  /**
   * Cursor used to paginate repositories
   */
  endCursor: string | null;
}

export class GithubDiscoveryEntityProvider
  implements IncrementalEntityProvider<Cursor, Context>
{
  private host: string;
  private credentialsProvider: DefaultGithubCredentialsProvider;
  private integration: GitHubIntegration;
  private logger: Logger;
  private organizations: string[];

  static create({
    host,
    config,
    organizations,
    logger,
  }: GithubDiscoveryEntityProviderOptions) {
    const integrations = ScmIntegrations.fromConfig(config);
    const credentialsProvider =
      DefaultGithubCredentialsProvider.fromIntegrations(integrations);
    const integration = integrations.github.byHost(host);

    assert(integration !== undefined, `Missing Github integration for ${host}`);

    return new GithubDiscoveryEntityProvider({
      credentialsProvider,
      host,
      integration,
      organizations,
      logger,
    });
  }

  private constructor(
    options: GithubDiscoveryEntityProviderConstructorOptions,
  ) {
    this.credentialsProvider = options.credentialsProvider;
    this.host = options.host;
    this.integration = options.integration;
    this.organizations = options.organizations;
    this.logger = options.logger;
  }

  getProviderName() {
    return `GithubDiscoveryEntityProvider:${this.host}`;
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

    await burst({ octokit, url });
  }

  async next(
    { octokit }: Context,
    cursor: Cursor = { endCursor: null },
  ): Promise<EntityIteratorResult<Cursor>> {
    const login = cursor.login ?? this.organizations[0];

    this.logger.info("Discovering catalog-info.yaml files", cursor);

    const data = await octokit.graphql<OrganizationRepositoriesQuery>(
      /* GraphQL */ `
        query OrganizationRepositories(
          $login: String!
          $endCursor: String
        ) {
          organization(login: $login) {
            repositories(first: 100, after: $endCursor) {
              pageInfo {
                hasNextPage
                endCursor
              }
              nodes {
                url
                defaultBranchRef {
                  name
                }
                catalogInfo: object(expression: "HEAD:catalog-info.yaml") {
                  __typename
                  ... on Blob {
                    id
                    text
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
      `,
      {
        login: login,
        endCursor: cursor.endCursor,
      },
    );

    let entities: DeferredEntity[] = [];

    if (data.organization && data.organization.repositories.nodes) {
      entities = data.organization.repositories.nodes
        ?.flatMap(node => {
          const parseResults: CatalogProcessorResult[] = [];
          if (node?.catalogInfo?.__typename === 'Blob') {
            if (node.catalogInfo.text) {
              const location = { type: 'url', target: `${node.url}/blob/${node.defaultBranchRef?.name}/catalog-info.yaml` };
              const content = Buffer.from(node.catalogInfo.text, 'utf8');
              for (const parseResult of parseEntityYaml(content, location)) {
                parseResults.push(parseResult);
              }
            }
          }
          return parseResults;
        })
        // TODO: convert error type into IngestionError 
        .flatMap(result => result.type === 'entity' ? [{
          entity: {
            ...result.entity,
            metadata: {
              ...result.entity.metadata,
              annotations: {
                ...result.entity.metadata.annotations,
                [ANNOTATION_LOCATION]: `url:${result.location.target}`,
                [ANNOTATION_ORIGIN_LOCATION]: this.getProviderName(),
              }
            }
          },
          locationRef: `url:${result.location.target}`
        }] : []);
    }  

    this.logger.info(`Discovered ${entities.length} entities`, cursor);

    if (data.organization?.repositories.pageInfo.hasNextPage) {
      const nextPage = {
        login,
        endCursor: data.organization.repositories.pageInfo.endCursor ?? null,
      };
      this.logger.debug(`Organization has more repositories - continue to the next page`, nextPage);
      return {
        done: false,
        cursor: nextPage,
        entities
      }
    }

    const nextOrganization = this.organizations[this.organizations.indexOf(login) + 1]

    if (nextOrganization) {
      const nextPage = {
        login: nextOrganization,
        endCursor: null
      };
      this.logger.debug(`Last page for current organization`, nextPage)
      return {
        done: false,
        cursor: nextPage,
        entities,
      }
    }

    return {
      done: true,
      cursor: { endCursor: null },
      entities,
    };
  }
}

interface GithubDiscoveryEntityProviderConstructorOptions {
  credentialsProvider: DefaultGithubCredentialsProvider;
  host: string;
  integration: GitHubIntegration;
  logger: Logger;
  organizations: string[];
}

interface GithubDiscoveryEntityProviderOptions {
  logger: Logger;
  config: Config;
  host: string;
  organizations: string[];
}
