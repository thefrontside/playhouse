import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: require.resolve('./src/schema.ts'),
  require: process.env.NODE_ENV !== 'test' ? ['ts-node/register'] : [],
  generates: {
    './src/modules/': {
      preset: 'graphql-modules',
      presetConfig: {
        baseTypesPath: '../__generated__/graphql.ts',
        filename: '__generated__/types.ts',
      },
      plugins: [
        { add: { content: '/* eslint-disable */\n// @ts-nocheck' } },
        'typescript',
        'typescript-resolvers',
      ],
    },
    './__generated__/schema.graphql': {
      plugins: ['schema-ast'],
    },
  },
};

export default config;
