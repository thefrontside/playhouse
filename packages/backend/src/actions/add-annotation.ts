import { createTemplateAction } from '@backstage/plugin-scaffolder-backend';
import { resolveSafeChildPath } from '@backstage/backend-common';
import fs from 'fs';
import yaml from 'js-yaml';
import { Entity } from '@backstage/catalog-model';


export function createAddAnnotation() {
  return createTemplateAction<{ path: string; }>({
    id: 'backend:add-annotation',
    description: 'Add annotation to catalog-info.yaml.',
    schema: {
      input: {
        type: 'object',
        required: ['path'],
        properties: {
          path: {
            title: 'Path',
            description: 'Path to catalog-info.yaml file to add annotation.',
            type: 'string',
          },
        },
      },
      output: {
        type: 'object',
        properties: {
          path: {
            title: 'Path',
            type: 'string',
          },
        },
      },
    },
    async handler(ctx) {
      const sourceFilepath = resolveSafeChildPath(
        ctx.workspacePath,
        ctx.input.path,
      );

      if (!fs.existsSync(sourceFilepath)) {
        ctx.logger.error(`The file ${sourceFilepath} does not exist.`);
        throw new Error(`The file ${sourceFilepath} does not exist.`);
      }
      const contentInfo = yaml.load(fs.readFileSync(sourceFilepath).toString()) as Entity;

      contentInfo.metadata.annotations = contentInfo.metadata.annotations ?? {};

      contentInfo.metadata.annotations["some-domain.com/website-url"] = "some-value";

      fs.writeFileSync(sourceFilepath, yaml.dump(contentInfo));
      
      ctx.output('path', sourceFilepath);
    },
  });
}