import { Operation, ensure } from 'effection';
import type { Factory } from '@simulacrum/github-api-simulator';
import { startStandaloneServer } from '@simulacrum/github-api-simulator';

import type { Server } from './server';
import { close } from './close';

export interface GithubApiOptions {
  factory: Factory;
  port: number;
}

export function createGithubApi(options: GithubApiOptions): Operation<void> {
  const { factory, port } = options;
  return {
    name: 'GithubAPI',
    labels: { port },
    *init() {
      const server: Server = yield startStandaloneServer({
        port,
        users: factory.all('User'),
        githubRepositories: factory.all('GithubRepository'),
        githubOrganizations: factory.all('GithubOrganization'),
      });

      yield ensure(() => close(server));
    },
  };
}
