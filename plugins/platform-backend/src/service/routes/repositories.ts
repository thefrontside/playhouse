import type { CatalogClient } from '@backstage/catalog-client'; 
import type { Entity } from '@backstage/catalog-model';
import CliTable3 from 'cli-table3';
import chalk  from 'chalk';
import Router from 'express-promise-router';
import express from 'express';
import { GetComponentRef, PlatformApi } from '../../types';

interface RouteOptions { 
  platform: PlatformApi;
  catalog: CatalogClient;
  getComponentRef: GetComponentRef;
}

type Route = (options: RouteOptions) => express.Router;

export const Repositories: Route = ({ platform, getComponentRef }) => {
  const router = Router();

  router.get('/', async (req, res) => {
    const repositories = await platform.getRepositories();

    if (req.accepts('json')) {
      res.json(repositories);
    } else {
      const table = new CliTable3({
        head: ['Component', 'Repository URL', 'Description']
      });
      table.push(
        ...repositories.items.map(({ value: r }) => ([r.componentRef, r.url, r.description]))
      )
      res.send(`\n${chalk.bold('  🥁 Available Repositories')}\n${table}`)
    }

    return router;
  });

  router.get('/:component/urls', async (req, res) => {
    const name = req.params.component;
    
    const ref = await getComponentRef(name);
    const urls = await platform.getRepositoryUrls(ref);

    if (urls) {
      res.json(urls)
    } else {
      res.sendStatus(404);
      res.send("Not Found");
    }
  });
  
  return router;
}
