import { FileHandle, mkdir, open } from 'fs/promises';
import { dirname } from 'path';
import { Operation, ensure } from 'effection';

export interface ProcessLog {
  out(data: string): Operation<void>;
  err(data: string): Operation<void>;
}

export interface ProcessLogOptions {
  name?: string;
  path: string;
  pluginId?: string;
}

export function createProcessLog({
  name,
  path,
  pluginId,
}: ProcessLogOptions): Operation<ProcessLog> {
  const outFilename = `${path}.out.log`;
  const errFilename = `${path}.err.log`;

  return {
    name: name ?? 'Process Log',
    labels: { path, out: outFilename, err: errFilename, expand: false },
    *init() {
      yield mkdir(dirname(path), { recursive: true });
      const out: FileHandle = yield open(outFilename, 'w');
      yield ensure(() => out.close());

      const err: FileHandle = yield open(errFilename, 'w');
      yield ensure(() => err.close());

      function filter(handle: FileHandle): ProcessLog['out'] {
        const write = (data: string) => handle.write(data).then(() => void 0);
        if (pluginId) {
          return data => {
            const raw = data.replace(ansiRegex(), '');
            if (raw.match(new RegExp(`^[^\\s]+ ${pluginId} `, 'g'))) {
              return write(data);
            }
            return Promise.resolve();
          };
        }
        return write;
      }

      return {
        out: filter(out),
        err: filter(err),
      };
    },
  };
}

export function ansiRegex({ onlyFirst = false } = {}) {
  const pattern = [
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))',
  ].join('|');

  return new RegExp(pattern, onlyFirst ? undefined : 'g');
}
