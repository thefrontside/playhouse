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

    const node = document.contents.getIn(splitPath(path));

    if (isSeq(node)) {
      node.add(document.createNode(value))
    }
  }

  return documents.map(document => document.toString()).join('');
}