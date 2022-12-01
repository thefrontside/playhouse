import type { Operation } from 'effection';
import type { Server } from './server';

export function close(server: Server): Operation<void> {
  return function* Close() {
    yield new Promise<void>((resolve, reject) => {
      server.close(err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  };
}
