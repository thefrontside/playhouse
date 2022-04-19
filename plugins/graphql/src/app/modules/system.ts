import { Entity, SystemEntity } from '@backstage/catalog-model';
import { createModule, gql } from 'graphql-modules';
import { resolverProvider } from '../resolver';

export const System = createModule({
  id: `system`,
  typeDefs: gql`
    union Ownable = System

    type System implements Node & Entity {
      id: ID!
      name: String!
      namespace: String
      title: String
      description: String
      tags: [String]
      links: [EntityLink]

      owner: Owner! @relation(type: "ownedBy")
      domain: Domain @relation(type: "partOf")
      components: [Component] @relation(type: "hasPart", kind: "component")
      resources: [Resource] @relation(type: "hasPart", kind: "resource")
    }
  `,
  providers: [
    resolverProvider({
      accept: (entity: Entity): entity is SystemEntity => entity.kind === 'System',
      resolve: entity => entity ? ({ __typeName: 'System', ...entity }) : null,
    }),
  ],
});
