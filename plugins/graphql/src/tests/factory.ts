import { Entity, stringifyEntityRef } from '@backstage/catalog-model';
import { createVertex, Graph, Seed, Vertex, constant, seedrandom } from '@frontside/graphgen';


import { faker as globalFaker, Faker } from '@faker-js/faker';
import { createGraph } from '@frontside/graphgen';

export interface Factory {
  graph: Graph
  entities: Iterable<Entity>;
  createComponent(preset: Partial<ComponentData> & {['Component.owner']: Record<string, unknown> }): string;
}

export interface ComponentData {
  name: string;
  description: string;
  type: string;
  lifecycle: string;
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
                } as ComponentData;
              }
            }
          },
          relationships: [{
            type: 'Component.owner',
            direction: 'from',
            size: constant(1),
            affinity: 0.05,
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
        }
      ],
      edge: [
        {
          name: 'Component.owner',
          from: 'Component',
          to: 'Group'
        }
      ]
    },
    seed: seedrandom(seed),
  });
  return {
    graph,
    entities: [],
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
