import { CoreSync, transformSchema } from '@frontside/hydraphql';
import { printSchemaWithDirectives } from '@graphql-tools/utils';
import { CatalogSync } from './catalog';

export const schema = printSchemaWithDirectives(
  transformSchema([CoreSync(), CatalogSync()]),
);
