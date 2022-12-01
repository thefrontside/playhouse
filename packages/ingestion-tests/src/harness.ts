import type { JsonObject } from '@backstage/types';

import { CatalogApi } from '@backstage/catalog-client';
import { mergeWith } from 'lodash';
import { createBackstage } from './support/backstage';
import { createGithubApi } from './support/github';

import { clearTestDatabases } from './support/database';
import { createProcessLog, ProcessLog } from './support/log';
import { ConfigReader } from '@backstage/config';
import { all, Operation } from 'effection';
import { assert } from 'assert-ts';
import { Factory } from '@simulacrum/github-api-simulator';

export * from './support/github';

export const overrides = {
  backend: {
    database: {
      prefix: 'ingestion_dev_backend_tests_',
    },
  },
  catalog: {
    processingIntervalSeconds: 3,
  },
  incrementalProviders: {
    github: { schedule: { test: true } },
  },
};

export interface BackstageHarness {
  /**
   * Actually fire up the entire backstage server. This will wipe the database,
   * start all simulators, and then run backstage.
   */
  start(): Operation<CatalogApi>;
}

export function createBackstageHarness(
  factory: Factory,
  ...configs: JsonObject[]
): BackstageHarness {
  const start = () => ({
    name: 'Backstage',
    *init() {
      const config = (mergeWith as any)(...configs, overrides, (_: JsonObject, b: JsonObject) => {
        return Array.isArray(b) ? b : undefined;
      });

      const reader = new ConfigReader(config);

      yield clearTestDatabases(config);

      const host = reader
        .getConfigArray('integrations.github')
        .at(0)
        ?.getString('apiBaseUrl');

      assert(!!host, `no host at integrations.github.host`);

      const port = Number(new URL(host).port);

      yield createGithubApi({
        factory,
        port,
      });

      const logs: ProcessLog[] = [
        yield createProcessLog({
          name: 'HttpRequestLogger',
          path: `logs/http`,
          pluginId: 'backstage',
        }),
        yield createProcessLog({
          name: 'CatalogLogger',
          path: `logs/catalog`,
          pluginId: 'catalog',
        }),
        yield createProcessLog({
          name: 'SearchLogger',
          path: `logs/search`,
          pluginId: 'search',
        }),
        yield createProcessLog({
          name: 'BackstageFirehoseLogger',
          path: 'logs/firehose',
        }),
      ];

      const log: ProcessLog = {
        out(data) {
          return all(logs.map(({ out }) => out(data))) as Operation<void>;
        },
        err(data) {
          return all(logs.map(({ err }) => err(data))) as Operation<void>;
        },
      };

      const catalog: CatalogApi = yield createBackstage({
        config,
        log,
      });

      return catalog;
    },
  });

  return { start };
}