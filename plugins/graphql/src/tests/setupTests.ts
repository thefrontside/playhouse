import { Operation, spawn, ensure, fetch, Symbol } from 'effection';
import { daemon, Process } from '@effection/process';
import { Config, ConfigReader } from '@backstage/config';
import type { JsonObject, JsonValue, JsonPrimitive } from '@backstage/types';
import { FileHandle, mkdir, open } from 'fs/promises';
import { dirname } from 'path';
import { knex, Knex } from 'knex';
import { merge } from 'lodash';
import { backstageConfig } from './testConfig';

export interface GraphQLAPI {
  query(query: string): Operation<JsonObject>;
}

export interface BackstageOptions {
  log?: boolean | ProcessLog;
  config?: JsonObject;
}

export function createBackstage(
  options: BackstageOptions = {},
): Operation<GraphQLAPI> {
  const { log = false } = options;
  const reader = new ConfigReader(merge(backstageConfig, options.config ?? {}));
  const baseUrl = reader.getString('backend.baseUrl');
  return {
    name: 'backstage server',
    labels: { baseUrl },
    *init() {
      const { JEST_WORKER_ID, ...env } = process.env;
      const proc: Process = yield daemon('yarn --cwd ../.. start-backend', {
        env: {
          ...env,
          NODE_ENV: 'development',
          ...configToEnv(reader),
        } as Record<string, string>,
      });

      yield spawn(
        proc.stdout.lines().forEach(function* (line) {
          if (line.match(/failed to start/)) {
            throw new Error(line);
          }
        }),
      );

      if (log) {
        yield spawn({
          name: 'stdout.log',
          expand: false,
          [Symbol.operation]: proc.stdout.forEach(function* (buffer) {
            const data = String(buffer);
            if (log === true) {
              console.log(data);
            } else {
              yield log.out(data);
            }
          }),
        });
        yield spawn({
          name: 'stderr.log',
          expand: false,
          [Symbol.operation]: proc.stderr.forEach(function* (buffer) {
            const data = String(buffer);
            if (log === true) {
              console.log(data);
            } else {
              yield log.out(data);
            }
          }),
        });
      }

      yield proc.stdout
        .lines()
        .grep(/Listening on/)
        .first();

      return {
        *query(query) {
          const result = yield fetch(`${baseUrl}/api/graphql`, {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            method: 'POST',
            body: JSON.stringify({ query: `{${query}}` }),
          }).json();
          if (result.errors && result.errors.length > 0) {
            throw new Error(JSON.stringify(result.errors, null, 2));
          }
          return result.data;
        },
      };
    },
  };
}

function configToEnv(config: Config): Record<string, string> {
  function collect(
    data: JsonValue,
    path: string[] = [],
  ): Record<string, string> {
    if (isObject(data)) {
      return Object.entries(data).reduce((env, [key, value]) => {
        return {
          ...env,
          ...collect(value ?? null, path.concat(key)),
        };
      }, {});
    } else if (isPrimitive(data)) {
      return { [`APP_CONFIG_${path.join('_')}`]: String(data) };
    } else if (Array.isArray(data)) {
      return {
        [`APP_CONFIG_${path.join('_')}`]: JSON.stringify(data),
      };
    }

    return {};
  }
  return collect(config.get());
}

function isPrimitive(json: JsonValue): json is JsonPrimitive {
  // eslint-disable-next-line eqeqeq
  return json == null || typeof json !== 'object';
}

function isObject(json: JsonValue): json is JsonObject {
  // eslint-disable-next-line eqeqeq
  return json != null && !Array.isArray(json) && typeof json === 'object';
}

export interface ProcessLog {
  out(data: string): Operation<void>;
  err(data: string): Operation<void>;
}

export interface ProcessLogOptions {
  name?: string;
  path: string;
}

export function createProcessLog({
  name,
  path,
}: ProcessLogOptions): Operation<ProcessLog> {
  const outFilename = `${path}.out.log`;
  const errFilename = `${path}.err.log`;

  return {
    name: name ?? 'Process Log',
    labels: { path, out: outFilename, err: errFilename, expand: false },
    *init() {
      yield mkdir(dirname(path), { recursive: true });
      const out: FileHandle = yield open(outFilename, 'w');
      yield ensure(() => out.close());

      const err: FileHandle = yield open(errFilename, 'w');
      yield ensure(() => err.close());

      return {
        out: data => out.write(data).then(() => undefined),
        err: data => err.write(data).then(() => undefined),
      };
    },
  };
}

export function createTestLog(): Operation<ProcessLog> {
  const test = expect.getState().currentTestName;
  return createProcessLog({
    name: 'Test Log',
    path: `logs/${filenamify(test)}`,
  });
}

function filenamify(unsafe: string): string {
  return unsafe.replace(/\s/g, '-');
}

export function* clearTestDatabases(config: JsonObject): Operation<void> {
  const reader = new ConfigReader(config);
  const dbconfig = reader.get('backend.database');
  const prefix = reader.getString('backend.database.prefix');
  const connection = knex(dbconfig as Knex.Config);
  try {
    const result = yield connection.raw(`
SELECT datname
FROM pg_catalog.pg_database
WHERE datname LIKE '${prefix}%'
`);
    for (const row of result.rows) {
      yield connection.raw(`DROP DATABASE "${row.datname}"`);
    }
  } finally {
    yield connection.destroy();
  }
}
