import { Entity, stringifyEntityRef } from '@backstage/catalog-model';
import { createVertex, Graph, Seed, Vertex } from '@frontside/graphgen';


import { faker as globalFaker, Faker } from '@faker-js/faker';
import { createGraph } from '@frontside/graphgen';

export interface Factory {
  graph: Graph
  entities: Iterable<Entity>;
  createComponent(preset: Partial<ComponentData>): string;
}

export interface ComponentData {
  name: string;
  description: string;
  type: string;
  lifecycle: string;
  owner: string;
}

export function createFactory(): Factory {
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
                  lifecycle: 'PRODUCTION',
                  owner: 'developers'
                } as ComponentData;
              }
            }
          },
          relationships: []
        }
      ]
    },
    seed: () => Math.random()
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
