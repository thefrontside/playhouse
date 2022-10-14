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
import request from 'request';
import Router from 'express-promise-router';
import type { Logger } from 'winston';
import type { CatalogClient } from '@backstage/catalog-client';
import { findOrCreateExecutables } from '../executables';
import { readFile } from 'fs/promises';
import * as nunjucks from 'nunjucks';
import { PlatformApi, EntityRef } from '../types';
import fetch from 'node-fetch-native';

export interface RouterOptions {
  logger: Logger;
  discovery: PluginEndpointDiscovery;
  executableName: string;
  appURL: string;
  catalog: CatalogClient;
  platform: PlatformApi;
}


export async function createRouter(
  options: RouterOptions,
  ): Promise<express.Router> {
  const { catalog, logger, discovery, executableName, appURL, platform } = options;
    
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

  router.get('/executables', (_, response)=> {
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

  router.get('/components/:name/environments', async (req, res) => {
    let name = req.params.name;
    let component = await catalog.getEntityByRef(`component:default/${name}`);


    if (component) {
      let ref: EntityRef = {
        ref: `component:default/${name}`,
        compound: {
          kind: 'component',
          name,
          namespace: 'default'
        },
        load: () => Promise.resolve(component),
      };
      let environments = await platform.getEnvironments(ref);
      let names = environments.items.map(({ value }) => value.name);

      res.send(`${names.join("\n")}\n`);
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
      const post = await fetch(scaffolderUrl, {
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

      if(post.status !== 201) {
        throw new Error(`resource not created, ${post.status} - ${post.statusText}`);
      }
  
      const { id } = (await post.json()) as { id: string };

      res.json({ taskId: id });
    } catch(err) {
      logger.error(err);
      res.status(500);
      res.render('error', { error: err })
    }
  });


  router.get('/tasks/:taskId/eventstream', (req, res) => {
    const { taskId } = req.params;

    const eventStreamUrl = `${scaffolderUrl}/${encodeURIComponent(taskId)}/eventstream`

    req.pipe(request(eventStreamUrl)).pipe(res);
  })
  router.use(errorHandler());
  return router;
}
