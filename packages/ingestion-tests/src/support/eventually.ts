import { Operation, spawn, sleep } from 'effection';

/**
 * Runs an operation over and over again with the expectation that it will
 * eventually succeed within the window of the current test timeout. If it does
 * not, then it raises the error of the last attempt. This is useful for
 * asserting on extremely async processes like ingestion where we know that
 * something should happen, but we have no idea when.
 *
 * @param block the operation to run continously
 */
export function eventually<T>(
  block: Operation<T | T[]>,
  timeout = 20000,
): Operation<T | T[]> {
  return function* Eventually() {
    let error: Error | undefined = void 0;

    // blow up after the timeout perioud
    // eslint-disable-next-line func-names
    yield spawn(function* () {
      yield sleep(timeout);
      throw error ?? new Error('timeout');
    });

    // try the operation continously. This races against
    // the timeout.
    while (true) {
      try {
        return yield block;
      } catch (e) {
        error = e as Error;
        yield sleep(10);
      }
    }
  };
}
