import { resolveSafeChildPath } from '@backstage/backend-common';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { assert } from 'assert-ts';
import fs from 'fs-extra';
import _path from 'path';
import parseGitUrl from 'git-url-parse';
import { Logger } from 'winston';
import { parseAllDocuments, isMap, YAMLMap, ParsedNode } from 'yaml';
import { z } from 'zod';

interface CreateYamlUpdateActionOptions {
  logger: Logger;
}

const InputSchema = z.object({
  url: z.string().describe("URL of the YAML file to update"),
  path: z.string().describe("The path of the property to set"),
  value: z.union([z.string(), z.number(), z.null()]).describe("The value to set"),
  entityRef: z.string().optional().describe("entity ref of the entity to update")
});

type InputType = z.infer<typeof InputSchema>

export function createYamlUpdateAction(_options: CreateYamlUpdateActionOptions) {
  return createTemplateAction<InputType>({
    id: 'backend:yaml-update',
    description: 'Update properties of a YAML file',
    schema: {
      input: InputSchema,
      output: z.object({
        repoUrl: z.string(),
        filePath: z.string()
      })
    },
    async handler(ctx) {
      const { url, entityRef, path, value } = ctx.input;

      const { filepath, source, owner, name } = parseGitUrl(url);

      const sourceFilepath = resolveSafeChildPath(ctx.workspacePath, filepath);

      const content = await fs.readFile(sourceFilepath);
      
      const updated = update({ 
        content: content.toString(), 
        path, 
        value, 
        entityRef 
      });

      await fs.writeFile(sourceFilepath, updated);

      ctx.output('repoUrl', `${source}?repo=${name}&owner=${owner}`);
      ctx.output('filePath', filepath);
      ctx.output('path', _path.dirname(sourceFilepath));
    },
  });
}

const rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
const reEscapeChar = /\\(\\)?/g;

function splitPath(string: string) {
  const result = [];
  if (string.charCodeAt(0) === 46 /* . */) {
    result.push('');
  }
  string.replace(rePropName, (match, number, quote, subString) => {
    result.push(quote ? subString.replace(reEscapeChar, '$1') : (number || match))
    return '';
  });
  return result;
}

function update({ content, path, value, entityRef }: { content: string; path: string; value: string | number | null, entityRef?: string }) {
  const documents = parseAllDocuments(content);

  const keys = splitPath(path);

  for (const document of documents) {
    assert(isMap(document.contents));

    const documentEntityRef = stringifyEntityRef(
      document.contents.toJSON(),
    );

    if (entityRef && documentEntityRef !== entityRef) {
      continue;
    }

    let next = document.contents;
    for (let i = 0; i < keys.length; i++) {
      const isLast = (keys.length - 1) === i;
      const key = keys[i] as unknown as ParsedNode;

      if (isLast) {
        assert(!!value)
        next.set(key, document.createNode(value) as ParsedNode)
        continue;
      } 

      if (next.has(key)) {
        next = next.get(key) as YAMLMap.Parsed<ParsedNode, ParsedNode | null>;
      } else {
        const node = new YAMLMap();
        next.set(key, node as ParsedNode | null);
        next = node as YAMLMap.Parsed<ParsedNode, ParsedNode | null>
      }
    }
  }

  return documents.map(document => document.toString()).join('')
}