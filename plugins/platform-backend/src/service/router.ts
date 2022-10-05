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


import { errorHandler, PluginEndpointDiscovery, resolvePackagePath } from '@backstage/backend-common';
import express from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';
import { findOrCreateExecutables } from '../executables';

export interface RouterOptions {
  logger: Logger;
  discovery: PluginEndpointDiscovery;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, discovery } = options;

  let baseURL = await discovery.getBaseUrl('ldp');

  let executables = findOrCreateExecutables({
    logger,
    distDir: 'dist-bin',
    baseURL: `${baseURL}/executables/dist`,
    executableName: 'my-ldp',
    entrypoint: resolvePackagePath("@frontside/backstage-plugin-platform-backend", "cli", "main.ts"),
  })

  const router = Router();
  router.use(express.json());

  router.get('/health', (_, response) => {
    logger.info('PONG!');
    response.send({ status: 'ok' });
  });

  router.get('/executables', (_, response)=> {
    response.send(executables);
  });

  router.use('/executables/dist', express.static('dist-bin'));

  router.use(errorHandler());
  return router;
}
