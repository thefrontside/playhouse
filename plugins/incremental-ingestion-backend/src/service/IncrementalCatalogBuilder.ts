
import {
  IncrementalEntityProvider,
  IncrementalEntityProviderOptions,
  PluginEnvironment,
} from '../types';
import { CatalogBuilder as CoreCatalogBuilder } from '@backstage/plugin-catalog-backend';
import { Duration } from 'luxon';
import { Knex } from 'knex';
import { IncrementalIngestionEngine } from '../engine/IncrementalIngestionEngine';
import { applyDatabaseMigrations } from '../database/migrations';
import { IncrementalIngestionDatabaseManager } from '../database/IncrementalIngestionDatabaseManager';
import { createIncrementalProviderRouter } from '../routes';

class Deferred<T> implements Promise<T> {
  resolve!: (value: T) => void;
  reject!: (error: Error) => void;

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

  [Symbol.toStringTag]: 'Deferred' = 'Deferred';
}

/** @public */
export class IncrementalCatalogBuilder {
  /**
   * Creates the incremental catalog builder, which extends the regular catalog builder.
   * @param env - PluginEnvironment
   * @param builder - CatalogBuilder
   * @returns IncrementalCatalogBuilder
   */
  static async create(env: PluginEnvironment, builder: CoreCatalogBuilder) {
    const client = await env.database.getClient();
    const manager = new IncrementalIngestionDatabaseManager({ client });
    return new IncrementalCatalogBuilder(env, builder, client, manager);
  }

  private ready: Deferred<void>;

  private constructor(
    private env: PluginEnvironment,
    private builder: CoreCatalogBuilder,
    private client: Knex,
    private manager: IncrementalIngestionDatabaseManager,
  ) {
    this.ready = new Deferred<void>();
  }

  async build() {
    await applyDatabaseMigrations(this.client);
    this.ready.resolve();

    const routerLogger = this.env.logger.child({
      router: 'IncrementalProviderAdmin',
    });

    const incrementalAdminRouter = await createIncrementalProviderRouter(
      this.manager,
      routerLogger,
    );

    return { incrementalAdminRouter, manager: this.manager };
  }

  addIncrementalEntityProvider<T, C>(
    provider: IncrementalEntityProvider<T, C>,
    options: IncrementalEntityProviderOptions,
  ) {
    const { burstInterval, burstLength, restLength } = options;
    const { logger: catalogLogger, database, scheduler } = this.env;
    const ready = this.ready;

    this.builder.addEntityProvider({
      getProviderName: provider.getProviderName.bind(provider),
      async connect(connection) {
        const logger = catalogLogger.child({
          entityProvider: provider.getProviderName(),
        });

        logger.info(`Connecting`);

        const client = await database.getClient();

        const manager = new IncrementalIngestionDatabaseManager({ client });

        const engine = new IncrementalIngestionEngine({
          ...options,
          ready,
          manager,
          logger,
          provider,
          restLength,
          connection,
        });

        const frequency = Duration.isDuration(burstInterval)
          ? burstInterval
          : Duration.fromObject(burstInterval);
        const length = Duration.isDuration(burstLength)
          ? burstLength
          : Duration.fromObject(burstLength);

        await scheduler.scheduleTask({
          id: provider.getProviderName(),
          fn: engine.taskFn.bind(engine),
          frequency,
          timeout: length,
        });
      },
    });
  }
}
