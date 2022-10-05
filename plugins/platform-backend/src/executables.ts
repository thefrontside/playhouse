import type { Logger } from 'winston';
import type { CompilationTarget } from 'node-deno';
import { CompilationTargets, compile } from 'node-deno';
import { existsSync } from 'fs';
import { PluginEndpointDiscovery } from '@backstage/backend-common';

export type Executables = Record<CompilationTarget, Executable>;

export type Executable = {
  type: 'error';
  error: Error;
} | {
  type: 'failure',
  stderr: string;
  stdout: string;
} | {
  type: 'compiled';
  url: string;
  stderr: string;
  stdout: string;
} | {
  type: 'compiling';
  stderr: string;
  stdout: string;
}

export interface FindOrCreateOptions {
  baseURL: string;
  logger: Logger;
  distDir: string;
  executableName: string;
  entrypoint: string;
}

export function findOrCreateExecutables(options: FindOrCreateOptions): Executables {
  options.logger.info(`generating executables for ${options.executableName}`);
  return CompilationTargets.reduce((executables, target) => {
    return {
      ...executables,
      [target]: findOrCreateExecutable(target, options),
    }
  }, {}) as Executables;
}

function findOrCreateExecutable(target: CompilationTarget, options: FindOrCreateOptions): Executable {
  let { logger, distDir, executableName, entrypoint, baseURL } = options;
  let output = `${distDir}/${executableName}-${target}`;
  let url = `${baseURL}/${executableName}-${target}`;

  let executable: Executable = {
    type: 'compiling',
    stdout: '',
    stderr: '',
  }

  let ext = target.includes('windows') ? '.exe' : ''

  if (existsSync(`${output}${ext}`)) {
    logger.info(`found existing executable: ${output}`);
    executable = {
      type: 'compiled',
      url,
      stdout: '',
      stderr: '',
    }
  } else {
    logger.info(`compiling ${executableName} for ${target}`);
    compile({
      target,
      output,
      entrypoint,
    }).then(result => {
      let stdio = {
        stdout: result.stdout,
        stderr: result.stderr,
      };
      if (result.code !== 0) {
        logger.error(`compilation for ${target} failed: ${stdio.stderr}`);
        executable = {
          type: 'failure',
          ...stdio,
        }
      } else {
        logger.info(`compilation complete: ${output}`);
        executable = {
          type: 'compiled',
          url,
          ...stdio,
        }
      }
    }).catch(error => {
      logger.error(`compilation error: ${error}`);
      executable = {
        type: 'error',
        error
      }
    });
  }

  return new Proxy<Executable>({} as Executable, {
    get(_, prop: keyof Executable) {
      return executable[prop];
    },
    ownKeys: () => Object.keys(executable),
    getOwnPropertyDescriptor: (_, key) => ({
      value: executable[key as keyof Executable],
      enumerable: true,
      configurable: true,
    })
  });
}
