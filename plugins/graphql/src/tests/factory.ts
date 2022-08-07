import { Generate, createGraphGen, GraphGen, weighted } from '@frontside/graphgen';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fakergen } from './fakergen';
import { Component, Group, Resource, System, User, Api } from './__generated__/world.types';

export interface World {
  Group: Group;
  Component: Component;
  System: System;
  Api: Api;
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

// eslint-disable-next-line no-restricted-syntax
const sourceName = join(__dirname, 'world.graphql');

export function createFactory(seed = 'factory'): Factory {
  return createGraphGen<World>({
    seed,
    source: String(readFileSync(sourceName)),
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
