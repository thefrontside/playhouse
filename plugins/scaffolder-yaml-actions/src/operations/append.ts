import { stringifyEntityRef } from '@backstage/catalog-model';
import { assert } from 'assert-ts';
import { isMap, isSeq, parseAllDocuments } from 'yaml';
import { splitPath } from './_helpers';

export function append({
  content, path, value, entityRef,
}: {
  content: string;
  path: string;
  value: string | number | null | Record<string, any>;
  entityRef?: string;
}) {
  const documents = parseAllDocuments(content);

  for (const document of documents) {
    assert(isMap(document.contents));

    const maybeEntity = document.contents.toJSON();

    if (typeof maybeEntity.kind === 'string' &&
      typeof maybeEntity.name === 'string' &&
      entityRef &&
      stringifyEntityRef(maybeEntity) !== entityRef) {
      continue;
    }

    const keys = splitPath(path);
    const node = document.contents.getIn(keys);

    if (node === undefined) {
      const parentPath = [...keys];
      const key = parentPath.pop();
      const parent = document.contents.getIn(parentPath);
      if (isMap(parent)) {
        parent.add({ key, value: document.createNode([value])})
      }
    } else if (isSeq(node)) {
      node.add(document.createNode(value))
    } else {
      throw new Error(`Could not append to ${path} because array doesn't exist`)
    }
  }

  return documents.map(document => document.toString()).join('');
}