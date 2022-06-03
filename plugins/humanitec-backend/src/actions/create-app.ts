import { createTemplateAction } from '@backstage/plugin-scaffolder-backend';
import fetch from "cross-fetch";
import { stat, readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { loadAll } from 'js-yaml';
import { SetupFileSchema, EnvironmentType, AutomationType } from '../schemas/create-config';

interface HumanitecCreateApp {
  api: string;
  orgId: string;
}

export function createHumanitecApp({ api, orgId }: HumanitecCreateApp) {
  return createTemplateAction<{ appId: string; setupFile: string; }>({
    id: 'humanitec:create-app',
    schema: {
      input: {
        required: ['appId'],
        type: 'object',
        properties: {
          setupFile: {
            type: 'string',
          }
        },
      }
    },
    async handler({ logger, input, workspacePath }) {
      const client = createHumanitecClient({ api, orgId });

      const setupFile = input.setupFile ?? 'humanitec-apps.yaml';
      const setupFilePath = resolve(join(workspacePath, setupFile));

      let setupFileContent: unknown[] | null;
      try {
        setupFileContent = await loadSetupFile(setupFilePath);
        logger.info("Succesfully loadded contents of setup file.");
      } catch (e) {
        logger.error(e);
        return;
      }

      const apps = SetupFileSchema.parse(setupFileContent);

      for (const app of apps) {
        let _app: { id: string, name: string };
        try {
          _app = await client.createApplication({ id: app.id, name: app.name });
          logger.info(`Created ${app.name} with ${app.id}`)
        } catch (e) {
          logger.error(`Failed to create app ${app.id} with name ${app.name}`)
          logger.debug(e);
          continue;
        }

        if (app.environments) {
          for (const key in app.environments) {
            if (Object.prototype.hasOwnProperty.call(app.environments, key)) {
              const env = app.environments[key];

              let delta: { id: string };
              const payload = {
                metadata: env.metadata,
                modules: {
                  add: env.modules,
                  update: {},
                  remove: []
                },
              };

              try {
                delta = await client.createDelta(_app.id, payload);

                const url = client.buildUrl({
                  resource: 'DELTA',
                  env_id: env.metadata.env_id,
                  delta_id: delta.id,
                  app_id: _app.id
                });

                logger.info(`Created delta ${url}`);
                logger.debug(`Delta payload: ${JSON.stringify(payload)}`);
              } catch (e) {
                logger.error(`Could not create delta for ${_app.id}`);
                logger.debug(e);
              }
            }
          }
        }

        if (app.automations) {
          for (const env_id in app.automations) {
            if (Object.prototype.hasOwnProperty.call(app.automations, env_id)) {
              for (const automation of app.automations[env_id]) {
                try {
                  const created = await client.createAutomation(_app.id, env_id, automation);
                  logger.info(`Created automation[id: ${created.id}]`);
                  logger.debug(`Automation payload: ${JSON.stringify(automation)}`);
                } catch (e) {
                  logger.error(`Failed to create automation`)
                  logger.debug(e);
                }
              }
            }
          }
        }
      }
    },
  });
}

async function loadSetupFile(filePath: string) {
  const file = await stat(filePath);
  if (file.isFile()) {
    try {
      const content = await readFile(filePath);
      const documents = loadAll(`${content}`);
      return documents;
    } catch (e) {
      throw new Error(`Could not parse YAML from ${filePath}`);
    }
  }
  return null;
}

function createHumanitecClient({ api, orgId }: { api: string, orgId: string }) {
  async function _fetch<R = unknown, P = unknown>(method: 'POST' | 'GET', url: string, payload: P): Promise<R> {
    const response = await fetch(`${api}/orgs/${orgId}/${url}`, {
      method,
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.ok) {
      return await response.json();
    }

    throw new Error(`${method}: ${url} - failed due to ${response.status}: ${response.statusText}`);
  }

  return {
    createApplication(payload: { id: string, name: string }) {
      return _fetch<{ id: string, name: string }>('POST', 'apps', payload);
    },
    createDelta(appId: string, payload: CreateDeltaPayload) {
      return _fetch<{ id: string }>('POST', `apps/${appId}/deltas`, payload);
    },
    notifyOfImage(image: string, payload: { image: string }) {
      return _fetch<unknown>('POST', `images/${image}/builds`, payload);
    },
    deployDelta(appId: string, environment: string, payload: { delta_id: string, comment: string }) {
      return _fetch<{ id: string }>('POST', `apps/${appId}/envs/${environment}/deploys`, payload);
    },
    createAutomation(appId: string, envId: string, payload: AutomationType) {
      return _fetch<{ id: string; createdAt: string, update_to: string } & AutomationType>('POST', `apps/${appId}/envs/${envId}/rules`, payload)
    },
    buildUrl(params: URLs) {
      const baseUrl = `https://app.humanitec.io/orgs/${orgId}`;
      switch (params.resource) {
        case 'DELTA':
          return `${baseUrl}/apps/${params.app_id}/envs/${params.env_id}/draft/${params.delta_id}/workloads`;
        default:
          return ''
      }
    }
  }
}

type URLs = { resource: 'DELTA', env_id: string, delta_id: string, app_id: string }

interface CreateDeltaPayload {
  metadata: EnvironmentType['metadata'],
  modules: {
    add: EnvironmentType['modules'],
    update: EnvironmentType['modules'],
    remove: string[]
  }
}