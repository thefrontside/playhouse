export interface SourcegraphWebhookPayload {
  monitorDescription: string;
  monitorUrl: string;
  query: string;
  results: {
    repository: string;
    commit: string;
    diff: string;
    matchedDiffRanges: number[][];
  }[];
}

export interface SourcegraphSearch {
  search: {
    results: {
      results: {
        repository: {
          name: string;
        };
        file: {
          url: string;
          content: string;
        }
      }[];
    }
  }
}
