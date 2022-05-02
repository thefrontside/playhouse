/*
 * Copyright 2020 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { errorHandler, PluginEndpointDiscovery } from '@backstage/backend-common';
import express from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';
import { createTask, Effection } from 'effection';
import { inspect } from '@effection/inspect-utils';

export interface RouterOptions {
  logger: Logger;
  discovery: PluginEndpointDiscovery;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger } = options;

  const router = Router();
  router.use(express.json());

  router.get('/', (request, response) => {
    logger.info(`creating new inspector event stream`);
    // Mandatory headers and http status to keep connection open
    response.writeHead(200, {
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache',
      'Content-Type': 'text/event-stream',
    });

    let inspector = createTask(function*() {
      try {
        yield inspect(Effection.root).forEach(function*(event) {
          const data = JSON.stringify(event);
          response.write(`data: ${data}\n\n`);
          flush(response);
        });
      } finally {
        response.end();
      }
    })

    inspector.start();

    request.on('close', () => {
      logger.info('closing inspection event stream');
      inspector.halt()
    });
  });

  router.use(errorHandler());

  return router;
}

function flush(response: express.Response) {
  const flushable = response as unknown as { flush: Function };
  if (typeof flushable.flush === 'function') {
    flushable.flush();
  }
}
