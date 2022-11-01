import type { Logger } from 'winston';
import type { CompilationTarget } from 'node-deno';
import { CompilationTargets, run, compile } from 'node-deno';
import { existsSync } from 'fs';

export interface DownloadInfo {
  executableName: string;
  helpText: Async<string>;
  executables: Executables;
}

export type Executables = Record<CompilationTarget, Executable>;

type Async<T> = {
  "type": "pending";
} | {
  "type": "resolved";
  value: T;
} | {
  "type": "rejected";
  error: Error;
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
  baseURL: string;
  downloadsURL: string;
  logger: Logger;
  distDir: string;
  executableName: string;
  entrypoint: string;
}

export function getDownloadInfo(options: FindOrCreateOptions): DownloadInfo {
  let { executableName } = options;

  let executables = findOrCreateExecutables(options);

  let helpText = getHelpText(options);

  return { executableName, helpText, executables };
}

export function getHelpText(options: FindOrCreateOptions): Async<string> {
  let { executableName, entrypoint, baseURL, logger } = options;
  let description = "internal developer platform";

  let value: Async<string> = { "type": "pending" };

  run({
    entrypoint: [entrypoint, executableName, baseURL, `"${description}"`, "--help"],
  }).then(result => {
    if (result.code != 0) {
      logger.info(`help text generation failed: ${result.stderr}`);
      value = { "type": "rejected", error: new Error(result.stderr) };
    } else {
      logger.info("help text generated for platform executable");
      value = { "type": "resolved", value: result.stdout };
    }
  }).catch(error => {
    logger.error(`help text generation failed: ${error}`);
    value = { "type": "rejected", error };
  });

  return new Proxy({} as Async<string>, {
    get(_, prop: keyof Executable) {
      return value[prop];
    },
    ownKeys: () => Object.keys(value),
    getOwnPropertyDescriptor: (_, key) => ({
      value: value[key as keyof Executable],
      enumerable: true,
      configurable: true,
    })
  })
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
  let { logger, baseURL, distDir, executableName, entrypoint, downloadsURL } = options;
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
      // pass metadata as the first three args of the script
      entrypoint: [entrypoint, executableName, baseURL, '"internal developer platform"'],

      // only allow network access back to the backstage server
      allowNet: [new URL(baseURL).host],

      allowRead: true,

      allowRun: true,

      location: baseURL,

      // fail immediately if a permission is not present
      noPrompt: true,
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
