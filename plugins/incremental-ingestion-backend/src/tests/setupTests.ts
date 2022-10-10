/* eslint-disable func-names */
import express from 'express';
import Router from 'express-promise-router';
import { CatalogBuilder, CatalogProcessingEngine } from '@backstage/plugin-catalog-backend';
import { ensure, once, Operation } from 'effection';
import { Duration } from 'luxon';
import { createLogger, Logger, transports } from 'winston';
import { EntityIteratorResult, IncrementalCatalogBuilder } from '..';
import { IncrementalEntityProvider, IncrementalEntityProviderOptions, PluginEnvironment } from '../types';
import { createServiceBuilder, SingleHostDiscovery } from '@backstage/backend-common';

type Instruction = DataInstruction | ErrorInstruction;

interface DataInstruction {
  type: 'data';
  data: string[];
  totalPages: number;
  delay?: number;
}

interface ErrorInstruction {
  type: 'error';
  delay?: number;
}

interface SuccessResponse {
  status: 'success';
  data: string[];
  totalPages: number;
}

interface ErrorResponse {
  status: 'error';
  error: string;
}

type Response = SuccessResponse | ErrorResponse;

interface Client {
  fetch(page: number): Promise<Response>;
}

function delay(ms: number = 0) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class ClientFactory {
  private resolve: () => void = () => {};
  client: Client = { fetch() { throw new Error('Client is not ready') } };

  createClient(instructions: Instruction[]): Promise<void> {
    let instruction: Instruction | undefined;
    let restInstruction: Instruction[] = instructions;
    const pages: string[][] = [];

    this.client = {
      fetch: async (page: number) => {
        ([instruction, ...restInstruction] = restInstruction);
        if (instruction === undefined) {
          this.resolve();
          return { status: 'success', data: pages[page], totalPages: pages.length };
        }
        await delay(instruction.delay);
        if (instruction.type === 'data') {
          pages[page] = instruction.data;
          return { status: 'success', data: instruction.data, totalPages: instruction.totalPages };
        }
        return { status: 'error', error: '¯\\_(ツ)_/¯' };
      }
    }
    return new Promise<void>(resolve => (this.resolve = resolve));
  }
}

class EntityProvider implements IncrementalEntityProvider<number, Client> {
  getProviderName() { return 'EntityProvider' }

  constructor(private factory: ClientFactory) {

  }

  async around(burst: (client: Client) => Promise<void>): Promise<void> {
    await burst(this.factory.client);
  }

  async next(client: Client, page: number = 0): Promise<EntityIteratorResult<number>> {
    const response = await client.fetch(page);
    if (response.status === 'error') throw new Error(response.error);

    const nextPage = page + 1;
    const done = nextPage > response.totalPages;
    const entities = response.data.map(item => ({
      entity: {
        apiVersion: 'backstage.io/v1beta1',
        kind: 'Component',
        metadata: {
          name: item,
          annotations: {
            // You need to define these, otherwise they'll fail validation
            'backstage.io/managed-by-location': `test:${this.getProviderName()}`,
            'backstage.io/managed-by-origin-location': `test:${this.getProviderName()}`,
          }
        },
        spec: {
          type: 'service',
          lifecycle: 'production',
          owner: 'guest',
        }
      }
    }));

    return {
      done,
      entities,
      cursor: nextPage
    }
  }
}

export function useCatalog(env: PluginEnvironment & { discovery: SingleHostDiscovery, builder: CatalogBuilder, incrementalBuilder: IncrementalCatalogBuilder }): Operation<{ stop: () => Promise<void>, rebuild: Operation<void> }> {
  return {
    name: 'Catalog',
    *init() {
      let processingEngine: CatalogProcessingEngine;
      let router: express.Router;
      ;({ processingEngine, router } = yield env.builder.build());
      const proxyfiedRouter = new Proxy(router, {
        apply(_target, thisArg, argArray: Parameters<express.Router>) {
          return router.apply(thisArg, argArray);
        },
        get(_target, prop: keyof express.Router) {
          return router[prop]
        },
      })

      yield env.incrementalBuilder.build()
      yield processingEngine.start();
      yield ensure(() => processingEngine.stop());

      const apiRouter = Router();
      apiRouter.use('/catalog', proxyfiedRouter);

      const service = createServiceBuilder(module)
        .loadConfig(env.config)
        .addRouter('/api', apiRouter)

      yield service.start();

      return {
        stop: () => processingEngine.stop(),
        rebuild: () => ({
          name: 'Rebuild Catalog',
          *init() {
            const client = yield env.database.getClient()

            yield client.raw('TRUNCATE TABLE public.knex_migrations CASCADE');
            yield client.raw('TRUNCATE TABLE public.knex_migrations_lock CASCADE');
            yield client.raw('DROP TABLE public.final_entities CASCADE');
            yield client.raw('DROP TABLE public.locations CASCADE');
            yield client.raw('DROP TABLE public.location_update_log CASCADE');
            yield client.raw('DROP TABLE public.refresh_state CASCADE');
            yield client.raw('DROP TABLE public.refresh_state_references CASCADE');
            yield client.raw('DROP TABLE public.relations CASCADE');
            yield client.raw('DROP TABLE public.search CASCADE');
            yield client.raw('TRUNCATE TABLE ingestion.knex_migrations CASCADE');
            yield client.raw('TRUNCATE TABLE ingestion.knex_migrations_lock CASCADE');
            yield client.raw('DROP TABLE ingestion.ingestions CASCADE');
            yield client.raw('DROP TABLE ingestion.ingestion_marks CASCADE');
            yield client.raw('DROP TABLE ingestion.ingestion_mark_entities CASCADE');

            ;({ processingEngine, router } = yield env.builder.build());
            yield env.incrementalBuilder.build();
            yield processingEngine.start();
          }
        })
      }
    }
  }
}

export function useIncrementalBuilder(env: PluginEnvironment & { factory: ClientFactory }): Operation<{ builder: CatalogBuilder, incrementalBuilder: IncrementalCatalogBuilder }> {
  return {
    name: "IncrementalBuilder",
    *init() {
      const builder = CatalogBuilder.create(env);
      const incrementalBuilder = IncrementalCatalogBuilder.create(env, builder);

      const provider = new EntityProvider(env.factory);
      const schedule: IncrementalEntityProviderOptions = {
        burstInterval: Duration.fromObject({ milliseconds: 100 }),
        burstLength: Duration.fromObject({ milliseconds: 100 }),
        restLength: Duration.fromObject({ seconds: 1 }),
      }

      incrementalBuilder.addIncrementalEntityProvider(provider, schedule);

      return { builder, incrementalBuilder };
     }
  }
}

export function useLogger(): Operation<Logger> {
  return {
    name: "Logger",
    *init() {
      const transport = new transports.Console();
      const logger = createLogger({
        level: 'error',
        transports: [transport],
      });
      yield ensure(function* () {
        logger.end();
        logger.on('error', () => { /* noop */ });
        yield once(logger, 'finish')
      });
      return logger
    }
  }
}
