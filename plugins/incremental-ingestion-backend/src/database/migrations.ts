
import { resolvePackagePath } from '@backstage/backend-common';
import { Knex } from 'knex';

/** @public */
export async function applyDatabaseMigrations(knex: Knex): Promise<void> {
  const migrationsDir = resolvePackagePath('@frontside/backstage-plugin-incremental-ingestion-backend', 'migrations');

  await knex.raw('CREATE SCHEMA IF NOT EXISTS ingestion;');

  await knex.migrate.latest({
    schemaName: 'ingestion',
    directory: migrationsDir,
  });
}
