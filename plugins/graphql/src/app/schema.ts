import { printSchemaWithDirectives } from '@graphql-tools/utils';
import { transformSchema } from "./transform";

export default printSchemaWithDirectives(transformSchema([]));
