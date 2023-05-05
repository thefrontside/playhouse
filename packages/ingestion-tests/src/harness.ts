import type { JsonObject } from '@backstage/types';

import { CatalogApi } from '@backstage/catalog-client';
import { mergeWith } from 'lodash';
import { createBackstage } from './support/backstage';

import { clearTestDatabases } from './support/database';
import { createProcessLog, ProcessLog } from './support/log';
import { all, Operation } from 'effection';
import { assert } from 'assert-ts';

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
   * and then run backstage.
   */
  start(): Operation<CatalogApi>;
}

export function createBackstageHarness(
  npmScript: string,
  ...configs: JsonObject[]
): BackstageHarness {
  assert(!!npmScript, 'you must supply an npm script e.g. yarn workspace backend start')

  const start = () => ({
    name: 'Backstage',
    *init() {
      const config = (mergeWith as any)(...configs, overrides, (_: JsonObject, b: JsonObject) => {
        return Array.isArray(b) ? b : undefined;
      });

      yield clearTestDatabases(config);

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
        npmScript,
        config,
        log,
      });

      return catalog;
    },
  });

  return { start };
}
