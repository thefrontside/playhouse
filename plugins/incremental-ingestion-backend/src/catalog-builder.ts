import { Deferred, IncrementalEntityProvider, IncrementalEntityProviderOptions, PluginEnvironment } from './types';

import { CatalogBuilder as CoreCatalogBuilder } from '@backstage/plugin-catalog-backend';
import { Duration } from 'luxon';
import { createIterationDB } from './iteration-db';
import { applyDatabaseMigrations } from './migrations';

export type CatalogBuilder = typeof CoreCatalogBuilder.prototype & {
  addIncrementalEntityProvider<T, C>(
    provider: IncrementalEntityProvider<T, C>,
    options: IncrementalEntityProviderOptions,
  ): void;
};

// TODO: ensure ingestion and catalog share the same database client?
export const createCatalogBuilder = (env: PluginEnvironment): CatalogBuilder => {
  const { logger, database, scheduler } = env;
  const core = CoreCatalogBuilder.create(env);

  const ready = new Deferred<void>();

  function addIncrementalEntityProvider<T, C>(
    this: CatalogBuilder,
    provider: IncrementalEntityProvider<T, C>,
    options: IncrementalEntityProviderOptions,
  ) {
    const { burstInterval, burstLength, restLength } = options;
    this.addEntityProvider({
      getProviderName: provider.getProviderName,
      async connect(connection) {
        logger.info(`connecting incremental entity provider '${provider.getProviderName()}'`);
        const db = await createIterationDB({ ...options, ready, database, logger, provider, restLength, connection });
        const frequency = Duration.fromObject(burstInterval);
        const length = Duration.fromObject(burstLength);

        await scheduler.scheduleTask({
          id: provider.getProviderName(),
          fn: db.taskFn,
          frequency,
          timeout: length,
        });
      },
    });
  }

  return Object.create(core, {
    addIncrementalEntityProvider: {
      value: addIncrementalEntityProvider,
    },
    build: {
      async value() {
        const build = await core.build.call(this);
        await applyDatabaseMigrations(await database.getClient());
        ready.resolve();
        return build;
      },
    },
  });
};
