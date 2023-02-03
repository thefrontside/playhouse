#!/usr/bin/env node
import { Command } from 'commander';
import crypto from 'node:crypto';
import { main, createTask, fetch } from 'effection';
import { Octokit } from 'octokit';

main(function* () {
  if (!process.env.HUMANITEC_ORG_ID)
    throw new Error('HUMANITEC_ORG_ID env need to be set');

  let task = createTask(function* (scope) {
    const program = new Command();
    program
      .command('get-environments')
      .alias('get-envs')
      .action(async () => await scope.run(getEnvironments()));
    program
      .command('clone-environment')
      .alias('clone-env')
      .argument('[newEnvName]', 'name of new environment')
      .action(
        async newEnvName => await scope.run(cloneEnvironment({ newEnvName })),
      );
    program
      .command('tidy-previews')
      .action(async () => await scope.run(tidyPreviews()));
    program
      .command('replicas')
      .action(async () => await scope.run(getReplicas()));

    yield program.parseAsync();
  });
  task.start();
  task.catchHalt().catch(err => {
    console.error(err);
  });
});

function* getEnvironments({ silent = false }) {
  const { HUMANITEC_ORG_ID } = process.env;

  let url = `https://api.humanitec.io/orgs/${HUMANITEC_ORG_ID}/apps/backstage/envs`;
  let result = yield fetch(url, {
    method: 'GET',
    ...createHeaders(),
  });

  return yield processResponse({ result, silent });
}

function* cloneEnvironment({ newEnvName }) {
  if (!newEnvName) newEnvName = crypto.randomUUID();

  let quotes = '===================';
  const { HUMANITEC_ORG_ID } = process.env;
  if (!process.env.HUMANITEC_ORG_ID)
    throw new Error('HUMANITEC_ORG_ID env need to be set');

  let devEnvUrl = `https://api.humanitec.io/orgs/${HUMANITEC_ORG_ID}/apps/backstage/envs/production`;
  let devEnvResult = yield fetch(devEnvUrl, {
    method: 'GET',
    ...createHeaders(),
  });
  let devEnv = yield processResponse({
    result: devEnvResult,
    label: `production env metadata\n${quotes}`,
  });

  let url = `https://api.humanitec.io/orgs/${HUMANITEC_ORG_ID}/apps/backstage/envs`;
  let result = yield fetch(url, {
    method: 'POST',
    ...createHeaders(),
    body: JSON.stringify({
      from_deploy_id: devEnv.from_deploy_id,
      id: newEnvName,
      name: newEnvName,
      type: 'preview',
    }),
  });
  if (result.statusText === 'Conflict') {
    console.log(`Environment ${newEnvName} already exists. Skipping clone.`);
    return;
  }

  yield processResponse({
    result,
    label: `newly created ${newEnvName} env metadata\n${quotes}`,
  });

  let ruleUrl = `https://api.humanitec.io/orgs/${HUMANITEC_ORG_ID}/apps/backstage/envs/${newEnvName}/rules`;
  let artefactsFilter = `us-central1-docker.pkg.dev/frontside-humanitec/frontside-artifacts/backstage`;
  let ruleResult = yield fetch(ruleUrl, {
    method: 'POST',
    ...createHeaders(),
    body: JSON.stringify({
      active: true,
      artefacts_filter: [artefactsFilter],
      match_ref: `refs/heads/${newEnvName}/merge`,
      type: 'update',
    }),
  });

  yield processResponse({
    result: ruleResult,
  });
}

function* tidyPreviews() {
  let envs = yield getEnvironments({ silent: true });
  let previews = envs.filter(env => env.type === 'preview');

  let deletedEnvs = yield deleteUnusedEnvironments({ previews });
  let deletedEnvsID = deletedEnvs.map(env => env.id);
  let remainingEnvs = previews.filter(env => !deletedEnvsID.includes(env.id));
  let spunDownEnvs = yield spinDownEnvironment({ previews: remainingEnvs });
}

function* deleteUnusedEnvironments({ previews }) {
  let listOfPRs = yield queryRepoPRs();
  let listOfPRNumbers = listOfPRs.map(pull => `pr${pull.number}`);
  let previewsToDelete = previews.filter(
    preview => !listOfPRNumbers.includes(preview.id),
  );

  const { HUMANITEC_ORG_ID } = process.env;
  for (let preview of previewsToDelete) {
    let url = `https://api.humanitec.io/orgs/${HUMANITEC_ORG_ID}/apps/backstage/envs/${preview.id}`;
    let result = yield fetch(url, {
      method: 'DELETE',
      ...createHeaders(),
    });

    if (result.status === 204) {
      console.log(`deleting ${preview.id}`);
    } else {
      console.log(
        `attempted to delete ${preview.id}, but an issue arose, skipping`,
      );
      console.error(result);
    }
  }

  return previewsToDelete;
}

function* queryRepoPRs() {
  if (!process.env.GITHUB_TOKEN)
    throw new Error('GITHUB_TOKEN is required to query for PRs');
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  const { data } = yield octokit.rest.pulls.list({
    owner: 'thefrontside',
    repo: 'playhouse',
    state: 'open',
  });

  return data;
}

function* spinDownEnvironment({ previews }) {
  const { HUMANITEC_ORG_ID } = process.env;
  let envsToSpinDown = [];

  for (let preview of previews) {
    if (preview.last_deploy) {
      let lastDeployDT = new Date(preview.last_deploy.created_at);

      let minutesSinceLastDeploy = (new Date() - lastDeployDT) / 1000 / 60;
      let minutesInDay = 12 * 60; // 12 hours * 60 minutes
      if (minutesSinceLastDeploy > minutesInDay) envsToSpinDown.push(preview);
    }
  }

  for (let preview of envsToSpinDown) {
    let url = `https://api.humanitec.io/orgs/${HUMANITEC_ORG_ID}/apps/backstage/envs/${preview.id}/runtime/replicas`;
    // let url = `https://api.humanitec.io/orgs/${HUMANITEC_ORG_ID}/apps/backstage/envs/${preview.id}/runtime`;
    // method: 'GET',
    let result = yield fetch(url, {
      method: 'PATCH',
      ...createHeaders(),
      body: JSON.stringify({
        backstage: 0,
      }),
    });

    if (result.status === 204) {
      console.log(`spinning down ${preview.id}`);
    } else {
      console.log(
        `attempted to spin down ${preview.id}, but an issue arose, skipping`,
      );
      console.error(result);
    }
  }

  return envsToSpinDown;
}

function* getReplicas() {
  let envs = yield getEnvironments({ silent: true });
  const { HUMANITEC_ORG_ID } = process.env;

  for (let env of envs) {
    let url = `https://api.humanitec.io/orgs/${HUMANITEC_ORG_ID}/apps/backstage/envs/${env.id}/runtime`;
    let result = yield fetch(url, {
      method: 'GET',
      ...createHeaders(),
    });

    yield processResponse({ result });
  }
}

function createHeaders({ extraHeaders = {} } = { extraHeaders: {} }) {
  if (!process.env.HUMANITEC_TOKEN)
    throw new Error('HUMANITEC_TOKEN env need to be set');

  return {
    headers: {
      Authorization: `Bearer ${process.env.HUMANITEC_TOKEN}`,
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
  };
}

function* processResponse({ result, label, silent, throwOnError = true }) {
  let response = yield result.json();
  if (result.status < 400) {
    if (label && !silent) console.log(label);
    if (!silent) console.dir(response, { depth: 6 });
    return response;
  } else {
    console.error(response);
    if (throwOnError) throw new Error(response.message);
  }
}
