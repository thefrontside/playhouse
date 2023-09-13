import { generate } from '@graphql-codegen/cli';
import { default as config } from '../codegen';
import { Types } from '@graphql-codegen/plugin-helpers';

describe('graphql-catalog codegen', () => {
  it('should generate the correct code', async () => {
    const [tsFile, graphqlFile] = (await generate(config, false)).map(
      (file: Types.FileOutput) => file.content,
    );

    expect(tsFile).toMatchSnapshot('typescript');
    expect(graphqlFile).toMatchSnapshot('graphql');
  });
});
