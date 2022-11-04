import { DatabaseManager } from '@backstage/backend-common';
import { Entity, stringifyEntityRef } from '@backstage/catalog-model';
import type { Knex } from 'knex';
import { Logger } from 'winston';

export interface BatchLoaderOptions {
  logger: Logger;
  databaseManager: DatabaseManager;
}

export class BatchLoader {
  private readonly logger: Logger;
  private readonly manager: DatabaseManager;
  private client?: Knex;
  constructor(options: BatchLoaderOptions) {
    this.logger = options.logger;
    this.manager = options.databaseManager;
  }

  private async getClient(): Promise<Knex> {
    if (!this.client) {
      this.client = await this.manager.forPlugin('catalog').getClient();
    }
    return this.client;
  }

  public async getEntitiesByRefs(
    refs: (string | { kind: string; namespace?: string; name: string })[],
  ): Promise<(Entity | undefined)[]> {
    this.logger.info(`Loading entities for refs: ${refs}`);
    const client = await this.getClient();
    const stringifiedRefs = refs.map(ref => typeof ref === 'string' ? ref : stringifyEntityRef(ref))
    const rows = await client('final_entities')
      .select('final_entity as entity', 'refresh_state.entity_ref as ref')
      .join('refresh_state', 'final_entities.entity_id', 'refresh_state.entity_id')
      .whereIn('refresh_state.entity_ref', stringifiedRefs);

    const unsortedEntities = new Map(rows.map(row => [row.ref, JSON.parse(row.entity)]));
    const entities = stringifiedRefs.map(ref => unsortedEntities.get(ref));
    this.logger.info(`Loaded ${entities.length} entities`);
    return entities;
  }
}
