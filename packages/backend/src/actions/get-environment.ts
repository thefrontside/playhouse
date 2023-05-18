import { createTemplateAction } from '@backstage/plugin-scaffolder-node';

interface EnvironmentAction {
  registryUrl: string
  orgId: string
}

export function createGetEnvironmentAction({ registryUrl, orgId }: EnvironmentAction) {
  return createTemplateAction({
    id: 'backend:get-environment',
    schema: {
      output: {
        required: ['registryUrl'],
        properties: {
          registryUrl: {
            type: 'string'
          },
          orgId: {
            type: 'string'
          }
        }
      }
    },
    handler: async (ctx) => {
      ctx.output('orgId', orgId);
      ctx.output('registryUrl', registryUrl);
    },
  });
}
