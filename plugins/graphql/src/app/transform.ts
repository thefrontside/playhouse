import { resolvePackagePath } from '@backstage/backend-common';
import { loadFilesSync } from '@graphql-tools/load-files';
import { mergeTypeDefs } from '@graphql-tools/merge';
import { mapSchema, TypeSource } from '@graphql-tools/utils';
import { buildASTSchema } from 'graphql';
import { mappers } from './mappers';

export function transformSchema(source: TypeSource) {
  return mapSchema(
    buildASTSchema(
      mergeTypeDefs([
        loadFilesSync(
          resolvePackagePath(
            '@frontside/backstage-plugin-graphql',
            'src/app/modules/**/*.graphql'
          )
        ),
        source
      ])
    ),
    mappers,
  );
}
