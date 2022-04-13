import { Entity } from '@backstage/catalog-model';
import {
  Application,
  InjectionToken,
  Provider,
  ValueProvider,
} from 'graphql-modules';

export interface Resolver {
  resolve: ResolveEntityType;
}

export interface TypedEntity extends Entity {
  __typeName: string;
}

type ResolveEntityType<TEntity extends Entity = Entity> = (entity?: TEntity) => (TypedEntity & TEntity) | null;

export interface ResolverEntity<TEntity extends Entity = Entity> {
  accept(entity: Entity): entity is TEntity;
  resolve: ResolveEntityType<TEntity>;
}

const ResolverToken = new InjectionToken('resolver');
const defaultResolver: Resolver = {
  resolve: entity => (entity ? { __typeName: 'Unknown', ...entity } : null),
};

function isResolverProvider(
  provider: Provider,
): provider is ValueProvider<ResolverEntity> {
  return (provider as ValueProvider<unknown>).provide === ResolverToken;
}

export function createTypeResolver(application: Application): Resolver {
  const resolvers = application.ɵconfig.modules.reduce(
    // eslint-disable-next-line @typescript-eslint/no-shadow
    (resolvers, mod) =>
      resolvers.concat(
        mod.providers
          ?.filter(isResolverProvider)
          .map(({ useValue }) => useValue) ?? [],
      ),
    [] as ResolverEntity[],
  );
  return createResolver(resolvers);
}

function createResolver(resolvers: ResolverEntity[]) {
  return {
    resolve(entity?: Entity): TypedEntity | null {
      if (!entity) return null;

      const resolver =
        resolvers.find(({ accept }) => accept(entity)) ?? defaultResolver;

      return resolver.resolve(entity);
    },
  };
}

export function resolverProvider<TEntity extends Entity>(
  useValue: ResolverEntity<TEntity>,
): ValueProvider<ResolverEntity<TEntity>> {
  return { provide: ResolverToken, useValue };
}
