export const ORGANIZATION_REPOSITORIES_QUERY = /* GraphQL */ `
  fragment Organization on Organization {
    login
    id
    url
    repositories(first: 100, after: $repoCursor) {
      pageInfo {
        startCursor
        endCursor
        hasNextPage
      }
      nodes {
        ...Repository
      }
    }
  }
  fragment Repository on Repository {
    __typename
    id
    isArchived
    name
    nameWithOwner
    owner {
      __typename
      login
      url
    }
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
  query OrganizationRepositories($orgCursor: String, $repoCursor: String) {
    viewer {
      organizations(first: 1, after: $orgCursor) {
        pageInfo {
          startCursor
          endCursor
          hasNextPage
        }
        nodes {
          ...Organization
        }
      }
    }
  }
`;