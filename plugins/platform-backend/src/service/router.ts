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
import type { Logger } from 'winston';
import type { CatalogClient } from '@backstage/catalog-client';
import { findOrCreateExecutables } from '../executables';
import { readFile } from 'fs/promises';
import * as nunjucks from 'nunjucks';
import fetch from 'node-fetch-native';

export interface RouterOptions {
  logger: Logger;
  discovery: PluginEndpointDiscovery;
  executableName: string;
  appURL: string;
  catalog: CatalogClient;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { catalog, logger, discovery, executableName, appURL } = options;

  let baseURL = await discovery.getBaseUrl('idp');
  let downloadsURL = `${baseURL}/executables/dist`;
  let scaffolderUrl = `${await discovery.getBaseUrl('scaffolder')}/v2/tasks`;

  let executables = findOrCreateExecutables({
    logger,
    distDir: 'dist-bin',
    baseURL,
    downloadsURL,
    executableName,
    entrypoint: resolvePackagePath("@frontside/backstage-plugin-platform-backend", "cli", "main.ts"),
  })

  const router = Router();
  router.use(express.json());

  router.get('/health', (_, response) => {
    logger.info('PONG!');
    response.send({ status: 'ok' });
  });

  router.get('/install.sh', async (_, response) => {
    response.setHeader('Content-Type', 'text/plain');
    let installerBytes = await readFile(resolvePackagePath("@frontside/backstage-plugin-platform-backend", "cli", "install.sh"));
    response.send(nunjucks.renderString(String(installerBytes), {
      appURL,
      downloadsURL,
      executableName,
    }));
  });

  router.get('/executables', (_, response) => {
    response.send(executables);
  });

  router.use('/executables/dist', express.static('dist-bin'));

  router.get('/components/:name/info', async (req, res) => {
    let name = req.params.name;
    let component = await catalog.getEntityByRef(`component:default/${name}`);
    if (component) {
      res.send(`${JSON.stringify(component, null, 2)}\n`);
    } else {
      res.sendStatus(404);
      res.send("Not Found");
    }
  })

  router.post('/create/:template', async (req, res) => {
    const template = req.params.template;

    logger.info(`creating template ${template}`);

    const values = req.body;

    try {
      const response = await fetch(scaffolderUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateRef: `template:default/${template}`,
          values: {
            ...values
          },
          secrets: {}
        })
      });
  
      const { id } = (await response.json()) as { id: string };
  
      res.json({ taskId: id });
    } catch(err) {
      logger.error(err);
      res.status(500);
      res.render('error', { error: err })
    }
  });

  router.use(errorHandler());
  return router;
}
