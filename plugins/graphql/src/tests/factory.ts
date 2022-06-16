import type { ComponentEntity, Entity } from '@backstage/catalog-model';
import { createVertex, Graph, Seed, Vertex } from '@frontside/graphgen';


import { faker as globalFaker, Faker } from '@faker-js/faker';
import { createGraph } from '@frontside/graphgen';

export interface Factory {
  graph: Graph
  entities: Iterable<Entity>;
  createComponent(preset: Partial<ComponentData>): ComponentEntity;
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
                  lifecycle: 'production',
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
      let { data } = vertex;
      return {
        kind: 'Component',
        apiVersion: 'backstage.io/v1beta1',
        metadata: {
          name: data.name,
          namespace: 'default',
          description: data.description,
        },
        spec: {
          type: data.type,
          lifecycle: data.lifecycle,
          owner: data.owner
        }
      }
    }
  };
}

function createFaker(seed: Seed): Faker {
  let faker = new Faker({ locales: globalFaker.locales });
  faker.seed(seed() * 1000);
  return faker;
}

export type { Graph } from '@frontside/graphgen';
