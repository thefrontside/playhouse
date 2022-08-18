import { DatabaseManager } from '@backstage/backend-common';
import {
  CompoundEntityRef,
  Entity,
  stringifyEntityRef,
} from '@backstage/catalog-model';
import { Knex } from 'knex';
import { Logger } from 'winston';

export interface BatchLoaderOptions {
  logger: Logger;
  databaseManager: DatabaseManager;
}

export class BatchLoader {
  private readonly logger: Logger;
  private readonly manager: DatabaseManager;
  private readonly client: Promise<Knex>;
  constructor(options: BatchLoaderOptions) {
    this.logger = options.logger;
    this.manager = options.databaseManager;
    this.client = this.manager.forPlugin('catalog').getClient();
  }

  public async getEntitiesByRefs(
    refs: (string | CompoundEntityRef)[],
  ): Promise<Entity[]> {
    this.logger.info(`Loading entities for refs: ${refs}`);
    const client = await this.client;
    const stringifiedRefs = refs.map(ref => typeof ref === 'string' ? ref : stringifyEntityRef(ref))
    const rows = await client('final_entities')
      .select('final_entity as entity', 'refresh_state.entity_ref as ref')
      .join(client.raw('refresh_state ON refresh_state.entity_id = final_entities.entity_id'))
      .whereIn('refresh_state.entity_ref', stringifiedRefs);

    const unsortedEntities = new Map(rows.map(row => [row.ref, JSON.parse(row.entity)]));
    const entities = stringifiedRefs.map(ref => unsortedEntities.get(ref));
    this.logger.info(`Loaded ${entities.length} entities`);
    return entities;
  }
}
