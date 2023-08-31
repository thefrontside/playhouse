import { UrlReader, resolveSafeChildPath } from '@backstage/backend-common';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';

import { ScmIntegrations } from '@backstage/integration';
import { createFetchPlainAction } from '@backstage/plugin-scaffolder-backend';
import fs from 'fs-extra';
import parseGitUrl from 'git-url-parse';
import _path from 'path';
import { Logger } from 'winston';
import { z } from 'zod';
import { set } from '../operations/set';
import { isUrl } from './_helpers';

interface CreateYamlSetActionOptions {
  logger: Logger;
  integrations: ScmIntegrations;
  reader: UrlReader;
  id?: string;
}

const InputSchema = z.object({
  url: z.string().describe('URL of the YAML file to set or file system path (relative or absolute)'),
  path: z.string().describe('The path of the property to set'),
  value: z
    .union([z.string(), z.number(), z.null()])
    .describe('The value to set'),
  entityRef: z.string().optional().describe('entity ref of the entity to set'),
});

type InputType = z.infer<typeof InputSchema>;

export function createYamlSetAction({
  logger,
  integrations,
  reader,
  id = 'yaml:set',
}: CreateYamlSetActionOptions) {
  const fetchAction = createFetchPlainAction({
    reader,
    integrations,
  });

  return createTemplateAction<InputType>({
    id,
    description: 'Set property value of a YAML file',
    schema: {
      input: InputSchema,
      output: z.object({
        repoUrl: z.string(),
        filePath: z.string(),
      }),
    },
    async handler(ctx) {
      const { url, entityRef, path, value } = ctx.input;

      let sourceFilepath;
      if (isUrl(url)) {
        const { filepath, resource, owner, name } = parseGitUrl(url);

        // This should be removed in favour of using fetch:plain:file
        // FIX: blocked by https://github.com/backstage/backstage/issues/17072
        await fetchAction.handler({
          ...ctx,
          input: {
            url: _path.dirname(ctx.input.url),
          },
        });

        sourceFilepath = resolveSafeChildPath(ctx.workspacePath, filepath);

        ctx.output('repoUrl', `${resource}?repo=${name}&owner=${owner}`);
        ctx.output('filePath', filepath);
      } else if (_path.isAbsolute(url)) {
        sourceFilepath = url;
      } else {
        sourceFilepath = resolveSafeChildPath(ctx.workspacePath, url);
      }

      let content;
      try {
        content = await fs.readFile(sourceFilepath);
      } catch (e) {
        logger.error(`Could not read ${sourceFilepath}`, { action: id });
        throw e;
      }

      const updated = set({
        content: content.toString(),
        path,
        value,
        entityRef,
      });

      await fs.writeFile(sourceFilepath, updated);

      ctx.output('path', _path.dirname(sourceFilepath));
      ctx.output('sourceFilepath', sourceFilepath);
    },
  });
}



