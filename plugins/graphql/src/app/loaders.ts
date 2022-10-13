import type { EntityRef, Loader } from './types';
import { Entity } from '@backstage/catalog-model';
import DataLoader from 'dataloader';
import { EnvelopError } from '@envelop/core';
import { BatchLoader, BatchLoaderOptions } from '@frontside/backstage-plugin-batch-loader';

export type LoaderOptions = BatchLoaderOptions

export function createLoader(options: BatchLoaderOptions): Loader {
  const loader = new BatchLoader(options)
  return new DataLoader<EntityRef, Entity>(async (refs): Promise<Array<Entity | Error>> => {
    const entities = await loader.getEntitiesByRefs(refs as EntityRef[])
    return entities.map((entity, index) => entity ?? new EnvelopError(`no such node with ref: '${refs[index]}'`));
  });
}
