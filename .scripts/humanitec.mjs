#!/usr/bin/env node
import { Command } from 'commander';
import { main, createTask, fetch } from 'effection';
import crypto from 'node:crypto';

main(function* () {
  let task = createTask(function* (scope) {
    const program = new Command();
    program
      .command('get-environments')
      .action(async () => await scope.run(getEnvironments()));
    program
      .command('clone-environment')
      .argument('[newEnvName]', 'name of new environment')
      .action(
        async newEnvName => await scope.run(cloneEnvironment({ newEnvName })),
      );

    yield program.parseAsync();
  });
  task.start();
  task.catchHalt().catch(err => {
    console.error(err);
  });
});

function* getEnvironments() {
  const { HUMANITEC_ORG_ID } = process.env;
  if (!process.env.HUMANITEC_ORG_ID)
    throw new Error('HUMANITEC_ORG_ID env need to be set');

  let url = `https://api.humanitec.io/orgs/${HUMANITEC_ORG_ID}/apps/backstage/envs`;
  let result = yield fetch(url, {
    method: 'GET',
    ...createHeaders(),
  });

  yield processResponse({ result });
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

function* processResponse({ result, label }) {
  let response = yield result.json();
  if (result.status < 400) {
    if (label) console.log(label);
    console.dir(response);
    return response;
  } else {
    console.error(result);
    console.error(response);
    throw new Error(response.message);
  }
}
