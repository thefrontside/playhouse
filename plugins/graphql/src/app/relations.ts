import { ResolverContext } from './resolver-context';
import { encodeId } from './loaders';
import { Node } from './mappers';
// import { applyRelayPagination, RelayPagination, RelayPagingOptions } from '../pagination';

// export function hasMany<T extends Node>(relation: string, typename: string): ConnectionResolver<T> {
//   return async function resolve(source: Node, args: RelayPagingOptions, { loader }: ResolverContext) {
//     const entity = await loader.loadEntity(source.id);

//     const targets = (entity.relations ?? []).filter(({ type }) => type === relation).map(({ target }) => target);

//     const ids = targets.map(target =>
//       encodeId({
//         typename,
//         ...target,
//       }),
//     );

//     const relations = await loader.loadMany(ids);
//     return applyRelayPagination(relations as T[], args);
//   };
// }

export function hasOne<T extends Node>(
  relationType: string,
  typename: string,
): RelationshipResolver<T | undefined> {
  return async function resolve(
    source: Node,
    _args /* RelayPagingOptions */,
    { loader }: ResolverContext,
  ) {
    const entity = await loader.loadEntity(source.id);

    const [target] = (entity.relations ?? [])
      .filter(rel => rel?.type === relationType)
      // eslint-disable-next-line @typescript-eslint/no-shadow
      .map(({ target }) => target);

    if (!target) {
      return undefined;
    }

    const id = encodeId({
      typename,
      ...target,
    });

    const relation = await loader.load(id);

    return relation as T;
  };
}

// export interface ConnectionResolver<T extends Node> {
//   (source: Node, args: RelayPagingOptions, cxt: ResolverContext): Promise<RelayPagination<T>>;
// }

export interface RelationshipResolver<T extends Node | undefined> {
  (
    source: Node,
    args: any /* RelayPagingOptions */,
    cxt: ResolverContext,
  ): Promise<T | undefined>;
}
