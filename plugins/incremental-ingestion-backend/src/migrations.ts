import { resolvePackagePath } from '@backstage/backend-common';
import { Knex } from 'knex';

export async function applyDatabaseMigrations(knex: Knex): Promise<void> {
  const migrationsDir = resolvePackagePath('@devex/backend-incremental-ingestion', 'migrations');

  await knex.raw('CREATE SCHEMA IF NOT EXISTS ingestion;');

  await knex.migrate.latest({
    schemaName: 'ingestion',
    directory: migrationsDir,
  });
}
