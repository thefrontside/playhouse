/* eslint-disable func-names */
import Router from 'express-promise-router';
import { CatalogBuilder } from '@backstage/plugin-catalog-backend';
import { ensure, once, Operation } from 'effection';
import { Duration } from 'luxon';
import { createLogger, Logger, transports } from 'winston';
import { EntityIteratorResult, IncrementalCatalogBuilder } from '..';
import { IncrementalEntityProvider, IncrementalEntityProviderOptions, PluginEnvironment } from '../types';
import express from 'express';

interface Instruction {
  id: number;
  data: string[];
  retries?: number;
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
    let done = false;
    let instruction: Instruction | undefined = undefined;
    const totalPages = instructions.length

    this.client = {
      fetch: async (page: number) => {
        await delay();

        if (instruction && instruction.retries) instruction.retries--;
        if (done) {
          this.resolve();
          // return { status: 'error', error: 'Client is done' };
          // throw new Error('Client is done');
        }
        if (page >= totalPages) return { status: 'success', data: [], totalPages };
        if (instructions[page].id !== instruction?.id) instruction = { ...instructions[page] };
        if (instruction.delay) await delay(instruction.delay)
        if (instruction.retries) return { status: 'error', error: '¯\\_(ツ)_/¯' };
        if (page + 1 === totalPages) done = true;
        return { status: 'success', data: instruction.data, totalPages };
      }
    }
    return new Promise<void>(resolve => (this.resolve = resolve));
  }
}

// TODO example of scenario
// get 5 entities => get an error => start again => get 4 entities instead of 5

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

export function useCatalogPlugin(env: PluginEnvironment, factory: ClientFactory): Operation<express.Router> {
  return {
    name: "CatalogPlugin",
    *init() {
      const apiRouter = Router();
      const builder = CatalogBuilder.create(env);
      const incrementalBuilder = IncrementalCatalogBuilder.create(env, builder);

      const provider = new EntityProvider(factory);
      const schedule: IncrementalEntityProviderOptions = {
        burstInterval: Duration.fromObject({ milliseconds: 100 }),
        burstLength: Duration.fromObject({ milliseconds: 100 }),
        restLength: Duration.fromObject({ seconds: 1 }),
      }

      incrementalBuilder.addIncrementalEntityProvider(provider, schedule);

      const { processingEngine, router } = yield builder.build();
      yield incrementalBuilder.build()
      yield processingEngine.start();

      apiRouter.use('/catalog', router);

      yield ensure(() => processingEngine.stop());

      return apiRouter
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
