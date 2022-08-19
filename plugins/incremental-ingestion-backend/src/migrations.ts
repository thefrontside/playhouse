import { resolvePackagePath } from '@backstage/backend-common';
import { Knex } from 'knex';

export async function applyDatabaseMigrations(knex: Knex, annotationProviderKey: string): Promise<void> {
  const migrationsDir = resolvePackagePath('@devex/backend-incremental-ingestion', 'migrations');

  await knex.raw('CREATE SCHEMA IF NOT EXISTS ingestion;');

  await knex.raw(
    `CREATE INDEX IF NOT EXISTS current_entities ON public.final_entities ((final_entity::json #>> '{metadata, annotations, ${annotationProviderKey}}'));`,
  )

  await knex.migrate.latest({
    schemaName: 'ingestion',
    directory: migrationsDir,
  });
}
