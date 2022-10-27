import {
  createSimulationServer as createSimulacrumServer,
  Server,
} from '@simulacrum/server';
import { auth0 } from '@simulacrum/auth0-simulator';
import { Resource } from 'effection';
export type { Server } from '@simulacrum/server';

export function createSimulationServer(): Resource<Server> {
  return createSimulacrumServer({
    port: process.env.SIM_PORT ? Number(process.env.SIM_PORT) : 4000,
    simulators: {
      auth0,
    },
  });
}
