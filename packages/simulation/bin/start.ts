import { main } from 'effection';
import { createSimulationServer, Server } from '../src/server';
import { createClient } from '@simulacrum/client';

main(function* (): Generator<any, any, any> {
  let server: Server = yield createSimulationServer();

  let url = `http://localhost:${server.address.port}`;

  console.log(`🚀 simulacrum running at ${url}`);

  let client = createClient(url);

  let simulation = yield client.createSimulation('auth0', {
    options: {
      clientID: 'backstage_auth0_client_id',
      scope: 'openid user profile offline_access',
      audience: 'https://frontside-backstage',
    },
    services: {
      auth0: {
        port: 4400,
      },
    },
  });

  console.dir({ simulation }, { depth: 3 });

  const person = yield client.given(simulation, 'person');

  console.dir({ person }, { depth: 3 });

  yield;
});
