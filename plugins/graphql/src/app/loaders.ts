import type { EntityRef, Loader } from './types';
import type { Entity } from '@backstage/catalog-model';
import DataLoader from 'dataloader';
import { EnvelopError } from '@envelop/core';
import type { BatchLoader } from '@frontside/backstage-plugin-batch-loader';

export function createLoader(loader: Pick<BatchLoader,'getEntitiesByRefs'>): Loader {
  return new DataLoader<EntityRef, Entity>(async (refs): Promise<Array<Entity | Error>> => {
    const entities = await loader.getEntitiesByRefs(refs as EntityRef[])
    return entities.map((entity, index) => entity ?? new EnvelopError(`no such node with ref: '${refs[index]}'`));
  });
}
