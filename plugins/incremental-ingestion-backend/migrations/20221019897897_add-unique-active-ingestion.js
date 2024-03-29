

const { v4: uuidv4 } = require('uuid');

/**
 * @param { import("knex").Knex } knex
 */
exports.up = async function up(knex) {
  const schema = () => knex.schema.withSchema('ingestion');

  await knex.transaction(async tx => {
    const providers = await tx('ingestion.ingestions').distinct(
      'provider_name',
    );
    for (const provider of providers) {
      const valid = await tx('ingestion.ingestions')
        .where('provider_name', provider)
        .andWhere('rest_completed_at', null)
        .first();
      const invalid = [];

      const rows = await tx('ingestion.ingestions')
        .where('provider_name', provider)
        .andWhere('rest_completed_at', null);
      for (const row of rows) {
        if (row.id !== valid.id) {
          invalid.push(row.id);
        }
      }

      if (invalid.length > 0) {
        await tx('ingestion.ingestions').delete().whereIn('id', invalid);
        await tx('ingestion.ingestion_mark_entities')
          .delete()
          .whereIn(
            'ingestion_mark_id',
            tx('ingestion.ingestion_marks')
              .select('id')
              .whereIn('ingestion_id', invalid),
          );
        await tx('ingestion.ingestion_marks')
          .delete()
          .whereIn('ingestion_id', invalid);
      }
    }
  });

  await schema().alterTable('ingestions', t => {
    t.string('completion_ticket');
  });

  await knex.transaction(async tx => {
    await tx('ingestion.ingestions')
      .update('completion_ticket', 'open')
      .where('rest_completed_at', null);

    const rows = await tx('ingestion.ingestions').whereNot(
      'rest_completed_at',
      null,
    );
    for (const row of rows) {
      await tx('ingestion.ingestions')
        .update('completion_ticket', uuidv4())
        .where('id', row.id);
    }
  });

  await schema().alterTable('ingestions', t => {
    t.string('completion_ticket').notNullable().alter();
    t.unique(['provider_name', 'completion_ticket'], {
      indexName: 'ingestion_composite_index',
      deferrable: 'deferred',
    });
  });
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = async function down(knex) {
  const schema = () => knex.schema.withSchema('ingestion');

  await schema().alterTable('ingestions', t => {
    t.dropUnique(['provider_name', 'completion_ticket']);
  });
};
