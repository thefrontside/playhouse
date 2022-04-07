import { Entity } from '@backstage/catalog-model';
import {
  Application,
  InjectionToken,
  Provider,
  ValueProvider,
} from 'graphql-modules';
import { encodeId } from './loaders';

// TODO Replace to generated graphql type
export interface Node {
  id: string;
}

export interface Mapper {
  toNode(entity?: Entity): Node | null;
}

type Mandatory<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

type MappedNode<TNode extends TypedNode> = Omit<
  Mandatory<Partial<TNode>, '__typename'>,
  'id'
>;

interface TypedNode extends Node {
  __typename?: string;
}

export interface MapEntity<
  TEntity extends Entity = Entity,
  TNode extends TypedNode = TypedNode,
> {
  accept(entity: Entity): entity is TEntity;
  toNode(entity: TEntity): MappedNode<TNode>;
}

const MapperToken = new InjectionToken('mapper');

function isMapperProvider(
  provider: Provider,
): provider is ValueProvider<MapEntity> {
  return (provider as ValueProvider<unknown>).provide === MapperToken;
}

export function createApplicationMapper(application: Application): Mapper {
  const mappers = application.ɵconfig.modules.reduce(
    // eslint-disable-next-line @typescript-eslint/no-shadow
    (mappers, mod) =>
      mappers.concat(
        mod.providers
          ?.filter(isMapperProvider)
          .map(({ useValue }) => useValue) ?? [],
      ),
    [] as MapEntity[],
  );
  return createMapper(mappers);
}

export function createMapper(maps: MapEntity[]): Mapper {
  function toNode(entity?: Entity): Node | null {
    if (typeof entity === 'undefined') {
      return null;
    }

    const { kind } = entity;
    const { name, namespace = 'default' } = entity.metadata;

    const id = (typename: string) =>
      encodeId({ typename, kind, name, namespace });

    for (const map of maps) {
      if (map.accept(entity)) {
        const attrs = map.toNode(entity);
        return {
          ...attrs,
          id: id(attrs.__typename),
        };
      }
    }

    return {
      id: id('Unknown'),
    };
  }

  return { toNode };
}

export function entityToNode<TEntity extends Entity, TNode extends Node>(
  useValue: MapEntity<TEntity, TNode>,
): ValueProvider<MapEntity> {
  return {
    provide: MapperToken,
    useValue,
  };
}
