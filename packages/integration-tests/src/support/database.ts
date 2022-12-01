import { knex, Knex } from 'knex';
import type { Operation } from 'effection';
import { ConfigReader } from '@backstage/config';
import type { JsonValue, JsonObject } from '@backstage/types';

export function* clearTestDatabases(config: JsonObject): Operation<void> {
  const reader = new ConfigReader(config);
  const dbconfig = reader.get('backend.database');
  const prefix = reader.getString('backend.database.prefix');

  yield withConnection(
    dbconfig,
    connection =>
      function* () {
        const result = yield connection.raw(`
SELECT datname
FROM pg_catalog.pg_database
WHERE datname LIKE '${prefix}%'
`);

        for (const row of result.rows) {
          yield connection.raw(`
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '${row.datname}'`);

          yield connection.raw(`DROP DATABASE IF EXISTS "${row.datname}"`);
        }
      },
  );
}

function withConnection<T>(
  config: JsonValue,
  operation: (k: Knex) => Operation<T>,
): Operation<T> {
  return function* (): Operation<T> {
    const connection = knex(config as Knex.Config);

    try {
      return yield operation(connection);
    } finally {
      yield connection.destroy();
    }
  };
}

export function* findFinalEntity(
  metadataName: string,
  kind: string,
): Operation<{ name_final_entity: string; kind_final_entity: string }> {
  const dbconfig = getDatabaseConfig('hpdev_backend_tests_catalog');

  return yield withConnection(
    dbconfig,
    connection =>
      function* () {
        const result = yield connection.raw(`
SELECT
  name_final_entity,
  kind_final_entity
FROM (
  SELECT
    f_entity::json -> 'metadata' ->> 'name' as name_final_entity,
    f_entity::json ->> 'kind' as kind_final_entity
  FROM (
    SELECT final_entity::TEXT as f_entity
    FROM public.final_entities as db_1
  ) as db_2
  ) as db_3
WHERE name_final_entity = '${metadataName}' AND kind_final_entity = '${kind}'
        `);

        if (!result.rows[0]) return null;

        return result.rows[0];
      },
  );
}

/**
 * TODO: there is a US planned to transform this into a test yaml file so
 * getting these hardcoded like this is just a temporary function to make it easier to manage
 * */
function getDatabaseConfig(db: string): JsonObject {
  return {
    client: 'pg',
    connection: {
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'postgres',
      database: db,
    },
  };
}
