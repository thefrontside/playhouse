import { stringifyEntityRef } from '@backstage/catalog-model';
import { assert } from 'assert-ts';
import { ParsedNode, YAMLMap, isMap, parseAllDocuments } from 'yaml';
import { splitPath } from './_helpers';

export function set({
  content, path, value, entityRef,
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

    if (typeof maybeEntity.kind === 'string' &&
      (typeof maybeEntity.name === 'string' || typeof maybeEntity.metadata?.name === 'string') &&
      entityRef &&
      stringifyEntityRef(maybeEntity) !== entityRef) {
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
