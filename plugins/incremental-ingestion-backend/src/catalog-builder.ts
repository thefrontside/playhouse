import { Deferred, IncrementalEntityProvider, IncrementalEntityProviderOptions, PluginEnvironment } from './types';

import { CatalogBuilder as CoreCatalogBuilder } from '@backstage/plugin-catalog-backend';
import { Duration } from 'luxon';
import { createIterationDB } from './iteration-db';
import { applyDatabaseMigrations } from './migrations';

export class IncrementalCatalogBuilder {
  static create(env: PluginEnvironment, builder: CoreCatalogBuilder) {
    return new IncrementalCatalogBuilder(env, builder);
  }

  private env: PluginEnvironment;
  private ready: Deferred<void>;
  private builder: CoreCatalogBuilder;

  private constructor(env: PluginEnvironment, builder: CoreCatalogBuilder) {
    this.env = env;
    this.builder = builder;
    this.ready = new Deferred<void>();
  }

  async build() {
    const db = await this.env.database.getClient();

    await applyDatabaseMigrations(db);

    this.ready.resolve();
  }

  addIncrementalEntityProvider<T, C>(
    provider: IncrementalEntityProvider<T, C>,
    options: IncrementalEntityProviderOptions,
  ) {
    // TODO Check if build was called and throw error
    const { burstInterval, burstLength, restLength } = options;
    const { logger: catalogLogger, database, scheduler } = this.env;
    const ready = this.ready;

    return this.builder.addEntityProvider({
      getProviderName: provider.getProviderName.bind(provider),
      async connect(connection) {
        const logger = catalogLogger.child({ entityProvider: provider.getProviderName() });

        logger.info(`Connecting`);

        const db = await createIterationDB({ ...options, ready, database, logger, provider, restLength, connection });

        const frequency = Duration.isDuration(burstInterval) ? burstInterval : Duration.fromObject(burstInterval);
        const length = Duration.isDuration(burstLength) ? burstLength : Duration.fromObject(burstLength);

        await scheduler.scheduleTask({
          id: provider.getProviderName(),
          fn: db.taskFn,
          frequency,
          timeout: length,
        });
      },
    });
  }
}
