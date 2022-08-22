import type { AppConfig } from '@backstage/config';
import { loadConfig } from '@backstage/config-loader';
import type { Config } from "@backstage/plugin-catalog-backend/config";
import { load, loadAll } from 'js-yaml';
import fetch from 'node-fetch';
import { assert } from 'assert-ts';
import { Entities, entities } from './schema';
import type { World } from '../factory';
import { createFactory } from '../factory';
import { isUrl, pathIsAbsolute } from './util';
import path from 'path';
import fileUrl from 'file-url';

let factory = createFactory("demo");

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

async function loadYaml<T>(yamlUrl: string): Promise<T | T[]> {
  const domain = new URL(yamlUrl).host;

  const url = yamlUrl.replace(domain, 'raw.githubusercontent.com').replace('/blob', '');

  const response = await fetch(url, {
    headers: {
      Authorization: `token ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3.raw',
    }
  });

  const text = await response.text();

  if (text.indexOf('---') > -1) {
    return loadAll(text) as T[];
  }

  return load(text) as T;
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

interface ParseLocationOptions {
  file?: string;
  directory?: string;
}

export async function parseLocations({ file, directory }: ParseLocationOptions) {
  let appConfig: AppConfig | undefined = undefined;

  if (typeof file !== 'undefined') {
    if(isUrl(file)) {
      appConfig = await loadYaml<AppConfig>(file) as AppConfig;
    } else {
      const filePath = pathIsAbsolute(file) ?  file : path.relative(process.cwd(), file);

      appConfig = await loadYaml<AppConfig>(fileUrl(filePath)) as AppConfig;
    }
  } else {
    if (typeof directory === 'undefined') {
      directory = process.cwd();
    }
  }

  if (typeof directory !== 'undefined') {
    const { appConfigs } = await loadConfig({
      configRoot: pathIsAbsolute(directory) ? directory : path.relative(process.cwd(), directory),
      configTargets: []
    });

    appConfig = appConfigs[0];
  }

  assert(!!appConfig, `no appConfig loaded.`)

  const catalog = appConfig.data.catalog as Config['catalog'];

  assert(!!catalog?.locations, `no locations`);

  for (const location of catalog.locations) {
    try {
      const initial = await loadYaml<Entity>(location.target);

      const initialEntities = Array.isArray(initial) ? initial : [initial];

      for (const initialEntity of initialEntities) {
        if (initialEntity.kind === 'Location' as Entities) {
          await createEntitiesFromLocation(initialEntity, location.target);
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
