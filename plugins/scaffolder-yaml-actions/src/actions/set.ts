import { UrlReader, resolveSafeChildPath } from '@backstage/backend-common';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';

import { ScmIntegrations } from '@backstage/integration';
import { createFetchPlainAction } from '@backstage/plugin-scaffolder-backend';
import { assert } from 'assert-ts';
import fs from 'fs-extra';
import parseGitUrl from 'git-url-parse';
import _path from 'path';
import { Logger } from 'winston';
import { ParsedNode, YAMLMap, isMap, parseAllDocuments } from 'yaml';
import { z } from 'zod';

interface CreateYamlSetActionOptions {
  logger: Logger;
  integrations: ScmIntegrations;
  reader: UrlReader;
  id?: string;
}

const InputSchema = z.object({
  url: z.string().describe('URL of the YAML file to set'),
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

      const { filepath, resource, owner, name } = parseGitUrl(url);

      const sourceFilepath = resolveSafeChildPath(ctx.workspacePath, filepath);

      // This should be removed in favour of using fetch:plain:file
      // FIX: blocked by https://github.com/backstage/backstage/issues/17072
      await fetchAction.handler({
        ...ctx,
        input: {
          url: _path.dirname(ctx.input.url),
        },
      });

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

      ctx.output('repoUrl', `${resource}?repo=${name}&owner=${owner}`);
      ctx.output('filePath', filepath);
      ctx.output('path', _path.dirname(sourceFilepath));
    },
  });
}

const rePropName =
  /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
const reEscapeChar = /\\(\\)?/g;

function splitPath(string: string) {
  const result = [];
  if (string.charCodeAt(0) === 46 /* . */) {
    result.push('');
  }
  string.replace(rePropName, (match, number, quote, subString) => {
    result.push(
      quote ? subString.replace(reEscapeChar, '$1') : number || match,
    );
    return '';
  });
  return result;
}

export function set({
  content,
  path,
  value,
  entityRef,
}: {
  content: string;
  path: string;
  value: string | number | null;
  entityRef?: string;
}) {
  const documents = parseAllDocuments(content);

  const keys = splitPath(path);

  for (const document of documents) {
    assert(isMap(document.contents));

    const maybeEntity = document.contents.toJSON();

    if (
      typeof maybeEntity.kind === 'string' &&
      typeof maybeEntity.name === 'string' &&
      entityRef &&
      stringifyEntityRef(maybeEntity) !== entityRef
    ) {
      continue;
    }

    let next = document.contents;
    for (let i = 0; i < keys.length; i++) {
      const isLast = keys.length - 1 === i;
      const key = keys[i] as unknown as ParsedNode;

      if (isLast) {
        next.set(key, document.createNode(value) as ParsedNode);
        continue;
      }

      if (next.has(key)) {
        next = next.get(key) as YAMLMap.Parsed<ParsedNode, ParsedNode | null>;
      } else {
        const node = new YAMLMap();
        next.set(key, node as ParsedNode | null);
        next = node as YAMLMap.Parsed<ParsedNode, ParsedNode | null>;
      }
    }
  }

  return documents.map(document => document.toString()).join('');
}
