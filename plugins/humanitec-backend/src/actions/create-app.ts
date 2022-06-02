import { createTemplateAction } from '@backstage/plugin-scaffolder-backend';
import fetch from "cross-fetch";

interface HumanitecCreateApp {
  api: string;
  orgId: string;
}

export function createHumanitecApp({ api, orgId }: HumanitecCreateApp) {
  return createTemplateAction<{ appId: string; }>({
    id: 'humanitec:create_app',
    schema: {
      input: {
        required: ['appId'],
        type: 'object',
        properties: {
          appId: {
            type: 'string',
          },
        },
      }
    },
    async handler(ctx) {
      const appId = ctx.input.appId;

      try {
        await createNewApplication({ api, orgId, appId });
        console.log('Created new application in Humanitec');
      } catch (e) {
        console.error(e)
      }
    },
  });
}

async function createNewApplication({ api, orgId, appId }: { api: string, orgId: string, appId: string }) {
  const response = await fetch(`${api}/orgs/${orgId}/apps`, {
    method: 'POST',
    body: JSON.stringify({ "id": appId, "name": appId }),
    headers: {
      'Content-Type': 'application/json',
    }
  });

  if (response.ok) {
    return await response.json();
  }

  throw new Error(`Could not create an application: ${response.body}`);
}