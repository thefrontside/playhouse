exports.up = async (knex) => {
  const schema = () => knex.schema.withSchema('refs');

  await schema().raw(`
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
};
