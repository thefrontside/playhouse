/* eslint-disable func-names */
exports.up = async function (knex) {
  const schema = () => knex.schema.withSchema('ingestion');

  await schema().createTable('ingestions', table => {
    table.comment('Tracks ingestion streams for very large data sets');

    table.uuid('id', { primary: true }).notNullable().comment('Auto-generated ID of the ingestion');

    table.string('provider_name').notNullable().comment('each provider gets its own identifiable name');

    table
      .string('status')
      .notNullable()
      .comment('One of "interstitial" | "bursting" | "backing off" | "resting" | "complete"');

    table.string('next_action').notNullable().comment("what will this, 'ingest', 'rest', 'backoff', 'nothing (done)'");

    table
      .timestamp('next_action_at')
      .defaultTo(knex.fn.now())
      .comment('the moment in time at which point ingestion can begin again');

    table.string('last_error').comment('records any error that occured in the previous burst attempt');

    table.integer('attempts').defaultTo(0).comment('how many attempts have been made to burst without success');

    table.timestamp('created_at').defaultTo(knex.fn.now()).comment('when did this ingestion actually begin');

    table.timestamp('ingestion_completed_at').comment('when did the ingestion actually end');

    table.timestamp('rest_completed_at').comment('when did the rest period actually end');
  });

  await schema().createTable('ingestion_marks', table => {
    table.comment('tracks each step of an iterative ingestion');

    table.uuid('id', { primary: true }).notNullable().comment('Auto-generated ID of the ingestion mark');

    table.uuid('ingestion_id').notNullable().comment('The id of the ingestion in which this mark took place');

    table
      .json('cursor')
      .comment('the current data associated with this iteration wherever it is in this moment in time');

    table.integer('sequence').defaultTo(0).comment('what is the order of this mark');

    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await schema().createTable('ingestion_mark_entities', table => {
    table.comment('tracks the entities recorded in each step of an iterative ingestion');

    table.uuid('id', { primary: true }).notNullable().comment('Auto-generated ID of the marked entity');

    table
      .uuid('ingestion_mark_id')
      .notNullable()
      .comment('Every time a mark happens during an ingestion, there are a list of entities marked.');

    table.string('ref').notNullable().comment('the entity reference of the marked entity');
  });
};

exports.down = async function (knex) {
  const schema = () => knex.schema.withSchema('ingestion');

  await knex.raw('drop index if exists current_entities;');

  await schema().dropTable('ingestion_mark_entities');

  await schema().dropTable('ingestion_marks');

  await schema().dropTable('ingestions');
};
