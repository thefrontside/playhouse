import { createTemplateAction } from '@backstage/plugin-scaffolder-backend';
import fetch from "cross-fetch";
import { stat, readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { loadAll } from 'js-yaml';
import { SetupFileSchema, EnvironmentType } from '../schemas/create-config';

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
              try {
                delta = await client.createDelta(_app.id, env);
                logger.info(`Delta ${delta.id} created for ${_app.id}`);
                logger.debug(`Delta payload: ${JSON.stringify(env)}`)
              } catch (e) {
                logger.error(`Could not create delta for ${_app.id}`);
                logger.debug(e);
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
    createDelta(appId: string, payload: EnvironmentType) {
      return _fetch<{ id: string }>('POST', `apps/${appId}/deltas`, payload);
    }
  }
}