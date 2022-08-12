exports.up = async (knex) => {
  const schema = () => knex.schema.withSchema('refs');

  await schema().raw(`
  CREATE OR REPLACE FUNCTION entity_to_ref(entity text) RETURNS text AS $$
    SELECT FORMAT('%s:%s/%s',
      LOWER(entity::json #>> '{kind}'),
      LOWER(entity::json #>> '{metadata, namespace}'),
      LOWER(entity::json #>> '{metadata, name}'));
  $$ LANGUAGE sql IMMUTABLE;

  CREATE INDEX entity_ref_idx ON final_entities (entity_to_ref(final_entity));
  `);
};

exports.down = async (knex) => {
  const schema = () => knex.schema.withSchema('refs');

  await schema().raw(`DROP INDEX entity_ref_idx;`);
  await schema().dropFunction('entity_to_ref');
};
