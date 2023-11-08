import { CompoundEntityRef, Entity, parseEntityRef, stringifyEntityRef } from "@backstage/catalog-model";
import { decodeId, encodeId } from "@frontside/hydraphql";
import { CATALOG_SOURCE } from "./constants";

export function encodeEntityId(entityOrRef: Entity | CompoundEntityRef | string): string {
  const ref = typeof entityOrRef === 'string' ? entityOrRef : stringifyEntityRef(entityOrRef);
  return encodeId({
    source: CATALOG_SOURCE,
    typename: 'Node',
    query: { ref },
  });
}

export function decodeEntityId(id: string): CompoundEntityRef {
  const { query: { ref = '' } } = decodeId(id);

  return parseEntityRef(ref);
}
