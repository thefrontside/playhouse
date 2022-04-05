import { CatalogClient } from '@backstage/catalog-client';
import {
  ApiEntity,
  ComponentEntity,
  Entity,
  EntityName,
  SystemEntity,
} from '@backstage/catalog-model';

const getId = (entity: Entity) => entity.metadata.uid;
const getName = (entity: Entity) => entity.metadata.name;
const getNamespace = (entity: Entity) => entity.metadata.namespace;
const getTitle = (entity: Entity) => entity.metadata.title;
const getDescription = (entity: Entity) => entity.metadata.description;
const getTags = (entity: Entity) => entity.metadata.tags;
const getLinks = (entity: Entity) => entity.metadata.links;

const NodeResolver = {
  id: getId,
};

const EntityResolver = {
  ...NodeResolver,
  name: getName,
  namespace: getNamespace,
  title: getTitle,
  description: getDescription,
  tags: getTags,
  links: getLinks,
};

export const resolvers = {
  Lifecycle: {
    EXPERIMENTAL: 'experimental',
    PRODUCTION: 'production',
    DEPRECATED: 'deprecated',
  },
  Node: {
    __resolveType: (entity: Entity) => entity.kind,
    ...NodeResolver,
  },
  Component: {
    ...EntityResolver,
    type: (entity: ComponentEntity) => entity.spec.type,
    lifecycle: (entity: ComponentEntity) => entity.spec.lifecycle,
    owner: (entity: ComponentEntity) => entity.spec.owner,
    subcomponentOf: (entity: ComponentEntity) => entity.spec.subcomponentOf,
    components: (entity: ComponentEntity) =>
      entity.relations
        ?.filter(({ target }) => target.kind === 'component')
        .map(({ target }) => target), // TODO Check
    providesApis: (entity: ComponentEntity) => entity.spec.providesApis,
    consumesApis: (entity: ComponentEntity) => entity.spec.consumesApis,
    dependencies: (entity: ComponentEntity) => entity.spec.dependsOn,
    system: (entity: ComponentEntity) => entity.spec.system,
  },
  System: {
    ...EntityResolver,
    owner: (entity: SystemEntity) => entity.spec.owner,
    domain: (entity: SystemEntity) => entity.spec.domain,
    components: (entity: SystemEntity) =>
      entity.relations
        ?.filter(({ target }) => target.kind === 'component')
        .map(({ target }) => target),
    resources: (entity: SystemEntity) =>
      entity.relations
        ?.filter(({ target }) => target.kind === 'resources')
        .map(({ target }) => target),
  },
  API: {
    ...EntityResolver,
    type: (entity: ApiEntity) => entity.spec.type,
    lifecycle: (entity: ApiEntity) => entity.spec.lifecycle,
    owner: (entity: ApiEntity) => entity.spec.lifecycle,
    definition: (entity: ApiEntity) => entity.spec.definition,
    system: (entity: ApiEntity) => entity.spec.system,
    consumers: (entity: ApiEntity) =>
      entity.relations
        ?.filter(({ type }) => type === 'apiConsumedBy')
        .map(({ target }) => target),
    providers: (entity: ApiEntity) =>
      entity.relations
        ?.filter(({ type }) => type === 'apiProviderBy')
        .map(({ target }) => target),
  },
  Group: {
    ...EntityResolver,
  },
  User: {
    ...EntityResolver,
  },
  Resource: {
    ...EntityResolver,
  },
  Location: {
    ...EntityResolver,
  },
  Domain: {
    ...EntityResolver,
  },
  Template: {
    ...EntityResolver,
  },
  Query: {
    nodeById: async (
      _: any,
      { id }: { id: string },
      { catalog }: { catalog: CatalogClient },
    ) => {
      const name = JSON.parse(Buffer.from(id, 'base64').toString('utf-8'))
      return catalog.getEntityByName(name)
    },
  },
};
