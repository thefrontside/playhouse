import flatCache from 'flat-cache';
import { Generate, createGraphGen, GraphGen, weighted, CacheStorage, CacheValue } from '@frontside/graphgen';
import { join } from 'path';
import { fakergen } from './fakergen';
import { readFileSync } from 'fs';

export interface User {
  __typename: "User";
  displayName: string;
  description: string;
  name: string;
  email: string;
  picture: string;
}

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
  dependencies: Resource[];
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

export interface Resource {
  __typename: "Resource";
  name: string;
  description: string;
}

export interface World {
  Group: Group;
  Component: Component;
  System: System;
  API: API;
  Resource: Resource;
  User: User;
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

function createCacheStorage(): CacheStorage {
  const cache = flatCache.load('factory', join(__dirname, '..', '.cache'));

  const map = {
    get(key) {
      return cache.getKey(key);
    },
    set(key, value) {
      cache.setKey(key, value);
      cache.save(true);
      return map;
    },
  } as CacheStorage;
  return map;
}

// eslint-disable-next-line no-restricted-syntax
const sourceName = join(__dirname, 'world.graphql');

export function createFactory(seed = 'factory'): Factory {
  const storage = createCacheStorage();
  const source = String(readFileSync(join(__dirname, 'world.graphql')));

  return createGraphGen<World>({
    seed,
    storage,
    source,
    sourceName,
    generate: [gen, fakergen],
    compute: {
      "User.name": ({ displayName }) => `${displayName.toLowerCase().replace(/\s+/g, '.')}`,
      "User.email": ({ name }) => `${name}@example.com`,
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
