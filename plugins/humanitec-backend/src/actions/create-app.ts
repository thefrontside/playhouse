import { createTemplateAction } from '@backstage/plugin-scaffolder-backend';
import { stat, readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { loadAll } from 'js-yaml';
import { SetupFileSchema, createHumanitecClient } from '@frontside/backstage-plugin-humanitec-common';

interface HumanitecCreateApp {
  orgId: string;
  token: string;
}

export function createHumanitecApp({ token, orgId }: HumanitecCreateApp) {
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
      const client = createHumanitecClient({ orgId, token });

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

              const payload = {
                metadata: env.metadata,
                modules: {
                  add: env.modules,
                  update: {},
                  remove: []
                },
              };

              try {
                const delta = await client.createDelta(_app.id, payload);

                const url = client.buildUrl({
                  resource: 'DELTA',
                  env_id: env.metadata.env_id,
                  delta_id: delta.id,
                  app_id: _app.id
                });

                logger.info(`Created delta ${url}`);
                logger.debug(`Delta payload: ${JSON.stringify(payload)}`);

                try {
                  const deployment = await client.deployDelta(_app.id, delta.metadata.env_id, {
                    delta_id: delta.id,
                    comment: `Initial deployment of delta ${delta.id}`
                  });
                  logger.info(`Created deployment: ${deployment.id}`);
                } catch (e) {
                  logger.error(`Could not create deployment for ${delta.id}`);
                  logger.debug(e);
                }

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