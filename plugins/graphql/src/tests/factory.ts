import { stringifyEntityRef } from '@backstage/catalog-model';
import { createVertex, Graph, Seed, Vertex, constant, seedrandom, normal } from '@frontside/graphgen';

import { faker as globalFaker, Faker } from '@faker-js/faker';
import { createGraph } from '@frontside/graphgen';

export interface Factory {
  graph: Graph
  createComponent(preset: Partial<ComponentData>): string;
}

export interface ComponentData {
  name: string;
  description: string;
  type: string;
  lifecycle: string;
  ['Component.owner']: Record<string, unknown>;
  ['Component.system']: Record<string, unknown>;
  ['Component.subComponents']: Partial<ComponentData>[];
  ['Component.consumes']: Partial<APIData>[];
  ['Component.provides']: Partial<APIData>[];
}

export interface APIData {
  name: string;
}

export function createFactory(seed: string = 'factory'): Factory {
  let graph = createGraph({
    types: {
      vertex: [
        {
          name: 'Component',
          data() {
            return {
              description: 'create a component',
              sample(seed) {
                const faker = createFaker(seed);
                return {
                  name: faker.lorem.slug(),
                  description: faker.lorem.lines(1),
                  type: 'website',
                  lifecycle: 'production',
                  owner: 'developers'
                };
              }
            }
          },
          relationships: [{
            type: 'Component.owner',
            direction: 'from',
            size: constant(1),
            affinity: 0.05,
          }, {
            type: 'Component.system',
            direction: 'from',
            size: constant(1),
            affinity: 0.2,
          }, {
            type: 'Component.subComponents',
            direction: 'from',
            size: normal({ min: 0, max: 3, standardDeviation: 1, mean: 2 }),
            affinity: 0.2
          }, {
            type: 'Component.provides',
            direction: 'from',
            size: normal({ min: 0, max: 3, standardDeviation: 1, mean: 2 }),
          }, {
            type: 'Component.consumes',
            direction: 'from',
            size: normal({ min: 0, max: 3, standardDeviation: 1, mean: 2 }),
          }]
        }, {
          name: 'Group',
          data() {
            return {
              description: 'create a group',
              sample(seed) {
                let faker = createFaker(seed);
                let department = faker.commerce.department();

                return {
                  name: `${department.toLocaleLowerCase()}-department`,
                  description: `${department} Department`,
                  displayName: `${department} Department`,
                  email: `${department.toLowerCase()}@acme.com`,
                  picture: faker.image.business(void 0, void 0, true),
                }
              }
            }
          },
          relationships: [],
        },
        {
          name: 'System',
          data() {
            return {
              description: 'create a system',
              sample(seed) {
                let faker = createFaker(seed);
                let productName = faker.commerce.productName();
                return {
                  name: productName.toLocaleLowerCase().replace(/\s+/g, '-'),
                  description: `Everything related to ${productName}`,
                  displayName: productName
                }
              }
            }
          },
          relationships: [],
        }, {
          name: 'API',
          data() {
            return {
              description: 'create an API',
              sample(seed) {
                let faker = createFaker(seed);
                return {
                  name: faker.lorem.slug(2)
                }
              }
            }
          },
          relationships: [{
            type: 'Component.consumes',
            direction: 'to',
            size: normal({ min: 0, max: 3, standardDeviation: 1, mean: 2 }),
            affinity: 0.2
          }, {
            type: 'Component.provides',
            direction: 'to',
            size: normal({ min: 0, max: 3, standardDeviation: 1, mean: 2 }),
            affinity: 0.2
          }]
        }
      ],
      edge: [
        {
          name: 'Component.owner',
          from: 'Component',
          to: 'Group'
        }, {
          name: 'Component.system',
          from: 'Component',
          to: 'System',
        }, {
          name: 'Component.subComponents',
          from: 'Component',
          to: 'Component'
        }, {
          name: 'Component.provides',
          from: 'Component',
          to: 'API',
        }, {
          name: 'Component.consumes',
          from: 'Component',
          to: 'API',
        }
      ]
    },
    seed: seedrandom(seed),
  });
  return {
    graph,
    createComponent(preset) {
      let vertex: Vertex<ComponentData> = createVertex(graph, 'Component', preset);
      return stringifyEntityRef({ kind: 'Component', name: vertex.data.name });
    }
  };
}

function createFaker(seed: Seed): Faker {
  let faker = new Faker({ locales: globalFaker.locales });
  faker.seed(seed() * 1000);
  return faker;
}

export type { Graph } from '@frontside/graphgen';
