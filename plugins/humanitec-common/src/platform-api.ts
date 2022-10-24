import type { PlatformApi } from '@frontside/backstage-plugin-platform-backend';
import type { Entity } from '@backstage/catalog-model';

import { HUMANITEC_APP_ID_ANNOTATION, HUMANITEC_ORG_ID_ANNOTATION } from './constants';
import { createHumanitecClient } from './clients/humanitec';


export type HumanitecPlatformAPI = Pick<PlatformApi, 'getLogs' | 'getEnvironments'>
export function createHumanitecPlatformApi({ token }: { token: string }): HumanitecPlatformAPI {

  return {
    async *getLogs(ref, envId) {
      const entity = await ref.load();
      const { appId, orgId } = getHumanitecMetadata(entity);
      const client = createHumanitecClient({ token, orgId });
      const logs = await client.getEnvironmentLogsSnapshot(appId, envId);
      const bound = Math.floor(logs.length * .5);
      const send = logs.slice(0, bound);
      const stream = logs.slice(bound, logs.length);
      for (const message of send) {
        yield message.payload;
      }
      for (const message of stream) {
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 1500));
        yield message.payload;
      }
    },

    async getEnvironments(ref) {
      const entity = await ref.load();
      const { appId, orgId } = getHumanitecMetadata(entity);
      const client = createHumanitecClient({ token, orgId });
      const environments = await client.getEnvironments(appId);
      return {
        hasNextPage: false,
        hasPreviousPage: false,
        beginCursor: '',
        endCursor: '',
        items: environments.map(env => ({
          cursor: '',
          value: {
            id: env.id,
            name: env.name,
            type: env.type,
            url: `https://app.humanitec.io/orgs/${orgId}/apps/${appId}/envs/${env.id}`
          }
        })),
      };
    }
  }
}

function getHumanitecMetadata(entity: Entity) {
  const {
    [HUMANITEC_ORG_ID_ANNOTATION]: orgId,
    [HUMANITEC_APP_ID_ANNOTATION]: appId,
   } = entity.metadata.annotations ?? {};

  if (!orgId) {
    throw new Error(`${entity.kind}:${entity.metadata.name} is not a humanitec entity`);

  }
  if (!appId) {
    throw new Error(`${entity.kind}:${entity.metadata.name} is not a humanitec entity`);

  }
  return { orgId, appId };
}
