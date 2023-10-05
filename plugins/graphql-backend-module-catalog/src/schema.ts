import { transformSchema } from '@frontside/hydraphql';
import { printSchemaWithDirectives } from '@graphql-tools/utils';
import { Catalog } from './catalog';

export const schema = printSchemaWithDirectives(
  transformSchema([Catalog()]),
);
