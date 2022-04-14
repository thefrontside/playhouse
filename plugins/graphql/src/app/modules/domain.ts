import { DomainEntity, Entity } from '@backstage/catalog-model';
import { createModule, gql } from 'graphql-modules';
import { resolverProvider } from '../resolver';

export const Domain = createModule({
  id: `domain`,
  typeDefs: gql`
    union Ownable = Domain

    type Domain implements Node & Entity {
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
      hasPart: [System] @relation
    }
  `,
  providers: [
    resolverProvider({
      accept: (entity: Entity): entity is DomainEntity => entity.kind === 'Domain',
      resolve: entity => entity ? ({ __typeName: 'Domain', ...entity }) : null,
    }),
  ],
});
