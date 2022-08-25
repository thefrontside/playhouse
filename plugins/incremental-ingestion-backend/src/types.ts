import type { PluginDatabaseManager, UrlReader } from '@backstage/backend-common';
import type { PluginTaskScheduler } from '@backstage/backend-tasks';
import type { Config } from '@backstage/config';
import type { DeferredEntity } from '@backstage/plugin-catalog-backend';
import type { PermissionAuthorizer } from '@backstage/plugin-permission-common';
import type { DurationObjectUnits } from 'luxon';
import type { Logger } from 'winston';

/**
 * Ingest entities into the catalog in bite-sized chunks.
 *
 * A Normal `EntityProvider` allows you to introduce entities into the
 * processing pipeline by calling an `applyMutation()` on the full set
 * of entities. However, this is not great when the number of entities
 * that you have to keep track of is extremely large because it
 * entails having all of them in memory at once. An
 * `IncrementalEntityProvider` by contrast allows you to provide
 * batches of entities in sequence so that you never need to have more
 * than a few hundred in memory at a time.
 *
 */
export interface IncrementalEntityProvider<TCursor, TContext> {
  /**
   * This name must be unique between all of the entity providers
   * operating in the catalog.
   */
  getProviderName(): string;

  /**
   * Return a single page of entities from a specific point in the
   * ingestion.
   *
   * @param context - anything needed in order to fetch a single page.
   * @param cursor - a uniqiue value identifying the page to ingest.
   * @returns the entities to be ingested, as well as the cursor of
   * the the next page after this one.
   */
  next(context: TContext, cursor?: TCursor): Promise<EntityIteratorResult<TCursor>>;

  /**
   * Do any setup and teardown necessary in order to provide the
   * context for fetching pages. This should always invoke `burst` in
   * order to fetch the individual pages.
   *
   * @param burst - a function which performs a series of iterations
   */
  around(burst: (context: TContext) => Promise<void>): Promise<void>;
}

/**
 * Value returned by an @{link IncrementalEntityProvider} to provide a
 * single page of entities to ingest.
 */
export interface EntityIteratorResult<T> {
  /**
   * Indicates whether there are any further pages of entities to
   * ingest after this one.
   */
  done: boolean;

  /**
   * A value that marks the page of entities after this one. It will
   * be used to pass into the following invocation of `next()`
   */
  cursor: T;

  /**
   * The entities to ingest.
   */
  entities: DeferredEntity[];
}

export interface IncrementalEntityProviderOptions {
  /**
   * Entities are ingested in bursts. This interval determines how
   * much time to wait in between each burst.
   */
  burstInterval: DurationObjectUnits;

  /**
   * Entities are ingested in bursts. This value determines how long
   * to keep ingesting within each burst.
   */
  burstLength: DurationObjectUnits;

  /**
   * After a successful ingestion, the incremental entity provider
   * will rest for this period of time before starting to ingest
   * again.
   */
  restLength: DurationObjectUnits;

  /**
   * In the event of an error during an ingestion burst, the backoff
   * determines how soon it will be retried. E.g.
   * [{ minutes: 1}, { minutes: 5}, {minutes: 30 }, { hours: 3 }]
   */
  backoff?: [DurationObjectUnits, ...DurationObjectUnits[]];
}

export type PluginEnvironment = {
  logger: Logger;
  database: PluginDatabaseManager;
  scheduler: PluginTaskScheduler;
  config: Config;
  reader: UrlReader;
  permissions: PermissionAuthorizer;
};

export class Deferred<T> implements Promise<T> {
  // @ts-expect-error assigned in constructor, but TS cannot figure it out.
  resolve: (value: T) => void;
  // @ts-expect-error assigned in constructor, but TS cannot figure it out.
  reject: (error: Error) => void;

  then: Promise<T>['then'];
  catch: Promise<T>['catch'];
  finally: Promise<T>['finally'];

  constructor() {
    const promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });

    this.then = promise.then.bind(promise);
    this.catch = promise.catch.bind(promise);
    this.finally = promise.finally.bind(promise);
  }

  [Symbol.toStringTag] = 'Deferred' as const;
}