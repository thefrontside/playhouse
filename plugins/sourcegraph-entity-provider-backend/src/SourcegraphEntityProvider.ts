import {
  ANNOTATION_LOCATION,
  ANNOTATION_ORIGIN_LOCATION,
} from '@backstage/catalog-model';
import {
  CatalogProcessorEntityResult,
  EntityProvider,
  EntityProviderConnection,
  DeferredEntity,
  parseEntityYaml
} from '@backstage/plugin-catalog-backend';
import { Config } from '@backstage/config';
import { GraphQLClient, gql } from "graphql-request";
import { SourcegraphSearch, SourcegraphWebhookPayload } from "./types";

const sourcegraphFileMatchQuery = gql`
  query ($search: String!) {
    search(query: $search) {
      results {
        matchCount
        results {
          __typename
          ... on FileMatch {
            repository {
              name
            }
            file {
              url
              content
            }
          }
        }
      }
    }
  }
`;

const parseSourcegraphSearch = (data: SourcegraphSearch, providerName: string) => {
  const parseResults: DeferredEntity[] = [];
  data.search.results.results.forEach((result) => {
    const location = {
      type: "url",
      target: `${result.repository.name}/catalog-info.yaml`,
    };
    
    const catalogInfoYamlContent = Buffer.from(result.file.content, "utf8");
    for (const parseResult of parseEntityYaml(catalogInfoYamlContent, location)) {
      const parsed = parseResult as CatalogProcessorEntityResult;
      const annotated: DeferredEntity = {
        entity: {
          ...parsed.entity,
          metadata: {
            ...parsed.entity.metadata,
            annotations: {
              ...parsed.entity.metadata.annotations,
              [ANNOTATION_LOCATION]: `url:${parsed.location.target}`,
              [ANNOTATION_ORIGIN_LOCATION]: providerName,
            }
          }
        },
        locationKey: parsed.location.target
      };
      parseResults.push(annotated);
    }
  });
  return parseResults;
}

export class SourcegraphEntityProvider implements EntityProvider {
  private readonly config: Config;
  private connection?: EntityProviderConnection;
  private graphQLClient: GraphQLClient;

  static create(config: Config) {
    return new SourcegraphEntityProvider(config)
  }

  private constructor(
    config: Config
  ) {
    this.config = config;
    this.graphQLClient = new GraphQLClient("");
  }

  getProviderName(): string {
    return `sourcegraph-provider:${this.config.getString("sourcegraph.orgId")}`;
  }

  async connect(connection: EntityProviderConnection): Promise<void> {
    this.connection = connection;
    const endpoint = `https://${this.config.getString("sourcegraph.orgId")}.sourcegraph.com/.api/graphql`
    this.graphQLClient = new GraphQLClient(endpoint, {
      headers: {
        authorization: `token ${this.config.getString("sourcegraph.token")}`
      }
    });
    await this.full();
  }

  async full() {
    if (!this.connection) {
      throw new Error('Not initialized');
    }
    const data: SourcegraphSearch = await this.graphQLClient.request(sourcegraphFileMatchQuery, {
      search: "file:^catalog-info.yaml"
    });
    const parsed = parseSourcegraphSearch(data, this.getProviderName());
    console.log(JSON.stringify(parsed, null, 2))
    await this.connection.applyMutation({
      type: 'full',
      entities: parsed.map(entity => ({
        entity: entity.entity,
        locationKey: entity.locationKey,
      })),
    });
  }

  async delta(payload: SourcegraphWebhookPayload) {
    if (!this.connection) {
      throw new Error('Not initialized');
    }
    let toAdd: DeferredEntity[] = [];
    let toRemove: DeferredEntity[] = [];
    payload.results.forEach(async result => {
      const data: SourcegraphSearch = await this.graphQLClient.request(sourcegraphFileMatchQuery, {
        search: `file:^catalog-info.yaml repo:${result.repository}$`
      });
      const parsed = parseSourcegraphSearch(data, this.getProviderName());
      if (parsed.length) {
        toAdd.push(parsed[0]);
      } else {
        toRemove.push({
          "entity": {
            "apiVersion": "backstage.io/v1alpha1",
            "kind": "Component",
            "metadata": {
              "name": /[^\/]*$/.exec(result.repository)![0]
            },
          },
          "locationKey": `${result.repository}/catalog-info.yaml`
        }); 
      }
    });

    await this.connection.applyMutation({
      type: 'delta',
      added: [...toAdd],
      removed: [...toRemove],
    });
  }
}
