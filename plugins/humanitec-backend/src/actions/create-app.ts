import { createTemplateAction } from '@backstage/plugin-scaffolder-backend';
import fetch from "cross-fetch";

interface HumanitecCreateApp {
  api: string;
  appId: string;
}

export function createHumanitecApp({ api, appId }: HumanitecCreateApp) {
  return createTemplateAction<{ imageTag: string; orgId: string; appId: string; }>({
    id: 'humanitec:create_app',
    schema: {
      input: {
        required: ['orgId', 'appId'],
        type: 'object',
        properties: {
          imageTag: {
            type: 'string',
          },
          orgId: {
            type: 'string',
          },
          appId: {
            type: 'string',
          },
        },
      }
    },
    async handler(ctx) {
      const orgId = ctx.input.orgId;

      async function createNewApplication() {
        const response = await fetch(`${api}/orgs/${orgId}/apps`, {
          method: 'POST',
          body: JSON.stringify({ "id": appId, "name": appId }),
          headers: {
            'Content-Type': 'application/json',
          }
        });
        if (response.ok) {
          // let data = await response.json();
          // 🟡 https://api-docs.humanitec.com/#tag/Application/paths/~1orgs~1{orgId}~1apps/post
          // return data;
          return;
        }
        console.log({ response });
        throw new Error('Could not create an application');
      }

      await createNewApplication();
    },
  });
}
