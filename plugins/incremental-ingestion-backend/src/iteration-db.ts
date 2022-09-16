import type { PluginDatabaseManager } from '@backstage/backend-common';
import type { TaskFunction } from '@backstage/backend-tasks';
import type { DeferredEntity, EntityProviderConnection } from '@backstage/plugin-catalog-backend';
import type { Logger } from 'winston';
import type { DurationObjectUnits } from 'luxon';
import type { IncrementalEntityProvider, IncrementalEntityProviderOptions } from './types';
import type { Knex } from 'knex';
import type { AbortSignal } from 'node-abort-controller';

import { stringifyEntityRef } from '@backstage/catalog-model';
import { performance } from 'perf_hooks';
import { Duration } from 'luxon';
import { v4 } from 'uuid';
import { toHumanDuration } from './to-human-duration';

// If you change this, you must create a migration that will change this value in the database
const INCREMENTAL_ENTITY_PROVIDER_ANNOTATION = 'frontside/incremental-entity-provider';

export interface IterationDB {
  taskFn: TaskFunction;
}

export interface MarkRecord {
  id: string;
  sequence: number;
  ingestion_id: string;
  cursor: string;
  created_at: string;
}

interface IterationDBOptions {
  logger: Logger;
  connection: EntityProviderConnection;
  database: PluginDatabaseManager;
  provider: IncrementalEntityProvider<unknown, unknown>;
  restLength: DurationObjectUnits;
  ready: Promise<void>;
  backoff?: IncrementalEntityProviderOptions['backoff'];
}

export async function createIterationDB(options: IterationDBOptions): Promise<IterationDB> {
  const { database, provider, connection, logger, ready } = options;
  const restLength = Duration.isDuration(options.restLength) ? options.restLength : Duration.fromObject(options.restLength);
  const client = await database.getClient();
  const backoff = options.backoff ?? [{ minutes: 1 }, { minutes: 5 }, { minutes: 30 }, { hours: 3 }];

  return {
    async taskFn(signal) {
      try {
        logger.debug(`Begin tick`);
        await handleNextAction(signal);
      } catch (error) {
        logger.error(`${error}`);
        throw error;
      } finally {
        logger.debug(`End tick`);
      }
    },
  };

  async function handleNextAction(signal: AbortSignal) {
    await ready;
    await client.transaction(async tx => {
      const { ingestionId, nextActionAt, nextAction, attempts } = await getCurrentAction(tx);

      function update(attrs: Record<string, unknown>) {
        return tx('ingestion.ingestions').where('id', ingestionId).update(attrs);
      }

      switch (nextAction) {
        case 'rest': {
          const remainingTime = nextActionAt - Date.now();
          if (remainingTime <= 0) {
            logger.info(`Rest period complete. Ingestion will restart on the next tick.`);
            await update({
              next_action: 'nothing (done)',
              rest_completed_at: new Date(),
              status: 'complete',
            });
          } else {
            logger.debug(`Resting. Ingestion will restart in ${toHumanDuration(Duration.fromMillis(remainingTime))}`)
          }
          break;
        }
        case 'ingest':
          try {
            const done = await ingestOneBurst(ingestionId, signal, tx);
            if (done) {
              logger.info(`Ingestion is complete. Rest for ${restLength.toHuman()}`);
              await update({
                next_action: 'rest',
                next_action_at: new Date(Date.now() + restLength.as('milliseconds')),
                ingestion_completed_at: new Date(),
                status: 'resting',
              });
            } else {
              await update({
                attempts: 0,
                status: 'interstitial',
              });
            }
          } catch (error) {
            if ((error as Error).message && (error as Error).message === 'CANCEL') {
              logger.info(`Ingestion canceled.`);
              await update({
                next_action: 'cancel',
                last_error: (error as Error).message,
                next_action_at: new Date(),
                status: 'canceling',
              });
            } else {
              const currentBackoff = Duration.fromObject(backoff[Math.min(backoff.length - 1, attempts)]);

              const backoffLength = currentBackoff.as('milliseconds');

              logger.error(error);
              logger.info(
                `Error during ingestion burst. Ingestion will backoff for ${toHumanDuration(currentBackoff)}`,
              );

              await update({
                next_action: 'backoff',
                attempts: attempts + 1,
                last_error: String(error),
                next_action_at: new Date(Date.now() + backoffLength),
                status: 'backing off',
              });
            }
          }
          break;
        case 'backoff': {
          const remainingTime = nextActionAt - Date.now();
          if (remainingTime <= 0) {
            logger.info(
              `Backoff period is complete. Attempt to resume ingestion on next tick.`,
            );
            await update({
              next_action: 'ingest',
              status: 'bursting',
            });
          } else {
            logger.debug(`Backoff period will expire in ${toHumanDuration(Duration.fromMillis(remainingTime))}.`);
          }
          break;
        }
        case 'cancel':
          logger.info(`Current ingestion cancelled. Ingestion will restart on the next tick.`);
          await update({
            next_action: 'nothing (canceled)',
            rest_completed_at: new Date(),
            status: 'complete',
          });
          break;
        default:
          logger.error(`Incremental iterator received unknown action '${nextAction}'`);
      }
    });
  }

  async function getCurrentAction(tx: Knex) {
    const providerName = provider.getProviderName();
    const record = await tx('ingestion.ingestions')
      .where('provider_name', provider.getProviderName())
      .andWhere('rest_completed_at', null)
      .first();
    if (record) {
      return {
        ingestionId: record.id,
        nextAction: record.next_action as 'rest' | 'ingest' | 'backoff' | 'cancel',
        attempts: record.attempts as number,
        nextActionAt: record.next_action_at.valueOf() as number,
      };
    }
    const ingestionId = v4();
    const nextAction = 'ingest';
    await tx('ingestion.ingestions').insert({
      id: ingestionId,
      next_action: nextAction,
      provider_name: providerName,
      status: 'bursting',
    });
    return { ingestionId, nextAction, attempts: 0, nextActionAt: Date.now() };
  }

  async function ingestOneBurst(id: string, signal: AbortSignal, tx: Knex) {
    const lastMark: MarkRecord = await tx('ingestion.ingestion_marks')
      .where('ingestion_id', id)
      .orderBy('sequence', 'desc')
      .first();

    const cursor = lastMark ? lastMark.cursor : void 0;
    let sequence = lastMark ? lastMark.sequence + 1 : 0;

    const start = performance.now();
    let count = 0;
    let done = false;
    logger.info(`Burst initiated`);

    await provider.around(async function burst(context: unknown) {
      let next = await provider.next(context, cursor);
      count++;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        done = next.done;
        await mark(tx, id, sequence, next.entities, next.done, JSON.stringify(next.cursor));
        if (signal.aborted || next.done) {
          break;
        } else {
          next = await provider.next(context, next.cursor);
          count++;
          sequence++;
        }
      }
    });

    logger.info(
      `Burst complete (${count} batches in ${Duration.fromMillis(performance.now() - start).toHuman()}).`,
    );
    return done;
  }

  async function mark(
    tx: Knex,
    id: string,
    sequence: number,
    entities: DeferredEntity[],
    done: boolean,
    cursor: string,
  ) {
    logger.info(`Mark`, { entities: entities.length, cursor, done });

    const markId = v4();

    await tx('ingestion.ingestion_marks').insert({
      id: markId,
      ingestion_id: id,
      cursor,
      sequence,
    });

    if (entities.length > 0) {
      await tx('ingestion.ingestion_mark_entities').insert(
        entities.map(entity => ({
          id: v4(),
          ingestion_mark_id: markId,
          ref: stringifyEntityRef(entity.entity),
        })),
      );
    }

    const added = entities.map(deferred => ({
      ...deferred,
      entity: {
        ...deferred.entity,
        metadata: {
          ...deferred.entity.metadata,
          annotations: {
            ...deferred.entity.metadata.annotations,
            [INCREMENTAL_ENTITY_PROVIDER_ANNOTATION]: provider.getProviderName(),
          },
        },
      },
    }));

    async function computeRemoved(): Promise<DeferredEntity[]> {
      if (!done) return [];

      try {
        return (
          await tx('final_entities')
            .select(tx.ref('final_entity').as('entity'), tx.ref('refresh_state.entity_ref').as('ref'))
            .join(tx.raw('refresh_state ON refresh_state.entity_id = final_entities.entity_id'))
            .whereRaw(
              `((final_entity::json #>> '{metadata, annotations, ${INCREMENTAL_ENTITY_PROVIDER_ANNOTATION}}')) = ?`,
              [provider.getProviderName()],
            )
            .whereNotIn(
              'ref',
              tx('ingestion.ingestion_marks')
                .join(
                  'ingestion.ingestion_mark_entities',
                  'ingestion.ingestion_marks.id',
                  'ingestion.ingestion_mark_entities.ingestion_mark_id',
                )
                .select('ingestion.ingestion_mark_entities.ref'),
          )
        ).map(entity => ({ entity: JSON.parse(entity.entity) }));
      } catch (e) {
        logger.error(`Failed to determine entities to delete. ${e}`)
        return [];
      }
    }

    const removed = await computeRemoved();

    await connection.applyMutation({
      type: 'delta',
      added,
      removed,
    });
  }
}
