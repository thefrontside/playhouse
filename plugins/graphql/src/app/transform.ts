import { resolvePackagePath } from '@backstage/backend-common';
import { loadFilesSync } from '@graphql-tools/load-files';
import { mergeTypeDefs } from '@graphql-tools/merge';
import { TypeSource } from '@graphql-tools/utils';
import { buildASTSchema } from 'graphql';
import { transformDirectives } from './mappers';

export function transformSchema(source: TypeSource) {
  return transformDirectives(
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
  );
}
