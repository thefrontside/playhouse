import type { CatalogClient } from '@backstage/catalog-client';
import Router from 'express-promise-router';
import express from 'express';
import { GetComponentRef, PlatformApi } from '../../types';

interface RouteOptions {
  platform: PlatformApi;
  catalog: CatalogClient;
  getComponentRef: GetComponentRef;
}

type Route = (options: RouteOptions) => express.Router;

export const Logs: Route = ({ platform, getComponentRef }) => {
  const router = Router();

  router.get('/:component', async (req, response) => {
    // Mandatory headers and http status to keep connection open
    response.writeHead(200, {
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache',
      'Content-Type': 'text/event-stream',
    });

    let closed = false;

    req.on('close', () => {
      closed = true;
    });

    let ref = await getComponentRef(req.params.component);
    for await (const line of platform.getLogs(ref, "Development")) {
      if (closed) {
        return;
      } else {
        response.write(`${line}\n`);
        flush(response);
      }
    }
  });


  return router;
}

function flush(response: express.Response) {
  const flushable = response as unknown as { flush: Function };
  if (typeof flushable.flush === 'function') {
    flushable.flush();
  }
}
