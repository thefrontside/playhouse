import type { Logger } from 'winston';
import type { CompilationTarget } from 'node-deno';
import { CompilationTargets, compile } from 'node-deno';
import { existsSync } from 'fs';

export interface Executables extends  Record<CompilationTarget, Executable> {
  executableName: string;
}

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
  downloadsURL: string;
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
  }, { executableName: options.executableName }) as Executables;
}

function findOrCreateExecutable(target: CompilationTarget, options: FindOrCreateOptions): Executable {
  let { logger, distDir, executableName, entrypoint, downloadsURL } = options;
  let output = `${distDir}/${executableName}-${target}`;
  let url = `${downloadsURL}/${executableName}-${target}`;

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
