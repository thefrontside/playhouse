import { OrganizationMapper, RepositoryMapper } from "../types";
import { ANNOTATION_LOCATION, ANNOTATION_ORIGIN_LOCATION } from '@backstage/catalog-model';

export const defaultRepositoryMapper: RepositoryMapper = (repository) => [{
  entity: {
    kind: 'Resource',
    apiVersion: 'backstage.io/v1beta1',
    metadata: {
      annotations: {
        [ANNOTATION_LOCATION]: `url:${repository.url}`,
        [ANNOTATION_ORIGIN_LOCATION]: `url:${repository.url}`,
      },
      name: repository.nameWithOwner.replace('/', '__'),
    },
    spec: {
      type: 'github-repository'
    }
  },
  locationKey: `url:${repository.url}`
}]

export const defaultOrganizationMapper: OrganizationMapper = (organization) => [{
  entity: {
    kind: 'Resource',
    apiVersion: 'backstage.io/v1beta1',
    metadata: {
      annotations: {
        [ANNOTATION_LOCATION]: `url:${organization.url}`,
        [ANNOTATION_ORIGIN_LOCATION]: `url:${organization.url}`,
      },
      name: organization.login,
    },
    spec: {
      type: 'github-organization'
    }
  },
  locationKey: `url:${organization.url}`
}]