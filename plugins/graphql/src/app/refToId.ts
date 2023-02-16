import {
  CompoundEntityRef,
  stringifyEntityRef,
} from '@backstage/catalog-model';

export const refToId = (ref: CompoundEntityRef | string) => {
  return typeof ref === 'string' ? ref : stringifyEntityRef(ref);
};
