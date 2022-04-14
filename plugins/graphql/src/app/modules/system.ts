import { Entity, SystemEntity } from '@backstage/catalog-model';
import { createModule, gql } from 'graphql-modules';
import { resolverProvider } from '../resolver';

export const System = createModule({
  id: `system`,
  typeDefs: gql`
    union Ownable = System
    union Module = System

    type System implements Node & Entity {
      id: ID!
      name: String!
      namespace: String
      title: String
      description: String
      labels: [KeyValuePair]
      annotations: [KeyValuePair]
      tags: [String]
      links: [EntityLink]

      ownedBy: Owner! @relation
      partOf: Domain @relation
      hasPart: [SystemPart] @relation
    }
  `,
  providers: [
    resolverProvider({
      accept: (entity: Entity): entity is SystemEntity => entity.kind === 'System',
      resolve: entity => entity ? ({ __typeName: 'System', ...entity }) : null,
    }),
  ],
});
