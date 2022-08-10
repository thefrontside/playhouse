exports.up = async (knex) => {
  const schema = () => knex.schema.withSchema('refs');

  await schema().raw(`
  CREATE OR REPLACE FUNCTION field(anyelement, VARIADIC anyarray) RETURNS integer AS $$
    SELECT
      COALESCE(
      ( SELECT i FROM generate_subscripts($2, 1) gs(i)
        WHERE $2[i] = $1 ),
      0);
  $$ LANGUAGE SQL;

  CREATE VIEW refs.entities as SELECT
    FORMAT('%s:%s/%s',
      LOWER(final_entity::json #>> '{kind}'),
      LOWER(final_entity::json #>> '{metadata, namespace}'),
      LOWER(final_entity::json #>> '{metadata, name}')) as ref,
    final_entity FROM public.final_entities;
  `);
};

exports.down = async (knex) => {
  const schema = () => knex.schema.withSchema('refs');

  await schema().dropView('entities');
  await schema().dropFunction('field');
};
