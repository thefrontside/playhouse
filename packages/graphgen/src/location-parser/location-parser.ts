import { loadConfig } from '@backstage/config-loader';
import { findPaths } from '@backstage/cli-common';
import type { Config } from "@backstage/plugin-catalog-backend/config";
import yaml from 'js-yaml';
import fetch from 'node-fetch';
import { createFactory, World } from '@frontside/graphgen-backstage';
import { assert } from 'assert-ts';
import { Entities, entities } from './schema';

let factory = createFactory("demo");

const paths = findPaths(__dirname);

const pre: {
  [K in keyof World]: World[K][]
} = {
  Group: [
    {
      __typename: 'Group',
      name: 'CNCF',
      description: 'CNCF'
    },
    {
      __typename: 'Group',
      name: 'backstage/maintainers',
      description: 'backstage/maintainers'
    }
  ] as World['Group'][
    
  ],
  Component: [],
  System: [],
  API: [],
  Resource: [],
  User: [],
  Domain: [],
}

type Entity = {
  kind: Entities,
  spec: {
    targets?: string[]
  }
};

async function loadYaml<T>(url: string): Promise<T | T[]> {
  const response = await fetch(url, {
    headers: {
      Authorization: `token ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3.raw',
    }
  });

  const text = await response.text();

  if (text.indexOf('---') > -1) {
    return yaml.loadAll(text) as T[];
  }

  return yaml.load(text) as T;
}

async function createEntitiesFromLocation(location: Entity, url: string) {
  const targets = location.spec.targets;

  assert(Array.isArray(targets));

  for (const target of targets) {
    const baseUrl = url.slice(0, url.lastIndexOf('/'));
    const kindUrl = [baseUrl, target.replace(/^\.\//, '')].join('/');

    const raw = await loadYaml<{ kind: Entities }>(kindUrl);

    if (Array.isArray(raw)) {
      for (const element of raw) {
        const entity = entities[element.kind].parse(element);

        pre[entity.__typename].push(entity as any);
        factory.create(entity.__typename, entity);
      }

      continue;
    }

    const entity = entities[raw.kind].parse(raw);

    factory.create(entity.__typename, entity);
    pre[entity.__typename].push(entity as any);
  }
}


async function parseYaml() {
  const { appConfigs } = await loadConfig({
    configRoot: paths.ownRoot,
    configTargets: []
  });

  const catalog = appConfigs[0].data.catalog as Config['catalog'];

  assert(!!catalog?.locations, `no locations`);

  for (const location of catalog.locations) {
    const domain = new URL(location.target).host;

    const url = location.target.replace(domain, 'raw.githubusercontent.com').replace('/blob', '');

    try {
      const initial = await loadYaml<Entity>(url);

      const initialEntities = Array.isArray(initial) ? initial : [initial];

      for (const initialEntity of initialEntities) {
        if (initialEntity.kind === 'Location' as Entities) {
          await createEntitiesFromLocation(initialEntity, url);
        } else {
          const entity = entities[initialEntity.kind].parse(initialEntity);
          factory.create(entity.__typename, entity);
          pre[entity.__typename].push(entity as any);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }
}

function main() {
  parseYaml().then(() => {
    console.log('parsed!')
  }).catch(console.error)
}

main();