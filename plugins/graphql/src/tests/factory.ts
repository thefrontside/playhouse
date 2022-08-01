import { Generate, createGraphGen, GraphGen, seedrandom, weighted } from '@frontside/graphgen';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fakergen } from './fakergen';

export interface Group {
  __typename: "Group";
  name: string;
  description: string;
  department: string;
  displayName: string;
  email: string;
  picture: string,
}

export interface Component {
  __typename: "Component";
  name: string;
  description: string;
  type: string;
  lifecycle: string;
  owner: Group;
  partOf: (Component | System)[];
  subComponents: Component[];
  consumes: API[];
  provides: API[];
}

export interface System {
  __typename: "System";
  name: string;
  description: string;
  displayName: string;
}

export interface API {
  __typename: "API";
  name: string;
  description: string;
  consumedBy: Component[];
  providedBy: Component[];
}

export interface World {
  Group: Group;
  Component: Component;
  System: System;
  API: API
}

export type Factory = GraphGen<World>;

type Lifecycle = 'deprecated' | 'experimental' | 'production';

const lifecycles = weighted<Lifecycle>([['deprecated', .15], ['experimental', .5], ['production', .35]]);

const gen: Generate = (info) => {
  if (info.method === "@backstage/component.lifecycle") {
    return lifecycles.sample(info.seed);
  } else {
    return info.next();
  }
}

// eslint-disable-next-line no-restricted-syntax
const sourceName = join(__dirname, 'world.graphql');

export function createFactory(seedName = 'factory'): Factory {
  return createGraphGen<World>({
    seed: seedrandom(seedName),
    source: String(readFileSync(sourceName)),
    sourceName,
    generate: [gen, fakergen],
    compute: {
      "Group.name": ({ department }) => `${department.toLowerCase()}-department`,
      "Group.description": ({ department }) => `${department} Department`,
      "Group.displayName": ({ department }) => `${department} Department`,
      "Group.email": ({ department }) => `${department.toLowerCase()}@acme.com`,

      "Component.type": () => "website",

      "System.name": ({ displayName }) => displayName.toLowerCase().replace(/\s+/g, '-'),
      "System.description": ({ displayName }) => `Everything related to ${displayName}`,
    },
  });
}

// export function createFactory(seed: string = 'factory'): Factory {
//   let graph = createGraph({
//     types: {
//       vertex: [
//         {
//           name: 'Component',
//           data() {
//             return {
//               description: 'create a component',
//               sample(seed) {
//                 const faker = createFaker(seed);
//                 return {
//                   name: faker.lorem.slug(),
//                   description: faker.lorem.lines(1),
//                   type: 'website',
//                   lifecycle: 'production',
//                   owner: 'developers'
//                 };
//               }
//             }
//           },
//           relationships: [{
//             type: 'Component.owner',
//             direction: 'from',
//             size: constant(1),
//             affinity: 0.05,
//           }, {
//             type: 'Component.system',
//             direction: 'from',
//             size: constant(1),
//             affinity: 0.2,
//           }, {
//             type: 'Component.subComponents',
//             direction: 'from',
//             size: normal({ min: 0, max: 3, standardDeviation: 1, mean: 2 }),
//             affinity: 0.2
//           }, {
//             type: 'Component.provides',
//             direction: 'from',
//             size: normal({ min: 0, max: 3, standardDeviation: 1, mean: 2 }),
//           }, {
//             type: 'Component.consumes',
//             direction: 'from',
//             size: normal({ min: 0, max: 3, standardDeviation: 1, mean: 2 }),
//           }]
//         }, {
//           name: 'Group',
//           data() {
//             return {
//               description: 'create a group',
//               sample(seed) {
//                 let faker = createFaker(seed);
//                 let department = faker.commerce.department();

//                 return {
//                   name: `${department.toLocaleLowerCase()}-department`,
//                   description: `${department} Department`,
//                   displayName: `${department} Department`,
//                   email: `${department.toLowerCase()}@acme.com`,
//                   picture: faker.image.business(void 0, void 0, true),
//                 }
//               }
//             }
//           },
//           relationships: [],
//         },
//         {
//           name: 'System',
//           data() {
//             return {
//               description: 'create a system',
//               sample(seed) {
//                 let faker = createFaker(seed);
//                 let productName = faker.commerce.productName();
//                 return {
//                   name: productName.toLocaleLowerCase().replace(/\s+/g, '-'),
//                   description: `Everything related to ${productName}`,
//                   displayName: productName
//                 }
//               }
//             }
//           },
//           relationships: [],
//         }, {
//           name: 'API',
//           data() {
//             return {
//               description: 'create an API',
//               sample(seed) {
//                 let faker = createFaker(seed);
//                 return {
//                   name: faker.lorem.slug(2)
//                 }
//               }
//             }
//           },
//           relationships: [{
//             type: 'Component.consumes',
//             direction: 'to',
//             size: normal({ min: 0, max: 3, standardDeviation: 1, mean: 2 }),
//             affinity: 0.2
//           }, {
//             type: 'Component.provides',
//             direction: 'to',
//             size: normal({ min: 0, max: 3, standardDeviation: 1, mean: 2 }),
//             affinity: 0.2
//           }]
//         }
//       ],
//       edge: [
//         {
//           name: 'Component.owner',
//           from: 'Component',
//           to: 'Group'
//         }, {
//           name: 'Component.system',
//           from: 'Component',
//           to: 'System',
//         }, {
//           name: 'Component.subComponents',
//           from: 'Component',
//           to: 'Component'
//         }, {
//           name: 'Component.provides',
//           from: 'Component',
//           to: 'API',
//         }, {
//           name: 'Component.consumes',
//           from: 'Component',
//           to: 'API',
//         }
//       ]
//     },
//     seed: seedrandom(seed),
//   });
//   return {
//     graph,
//     createComponent(preset) {
//       let vertex: Vertex<ComponentData> = createVertex(graph, 'Component', preset);
//       return stringifyEntityRef({ kind: 'Component', name: vertex.data.name });
//     }
//   };
// };
