import type { PlatformApi } from '@frontside/backstage-plugin-platform-backend';
import type { Entity } from '@backstage/catalog-model';

import { HUMANITEC_APP_ID_ANNOTATION, HUMANITEC_ORG_ID_ANNOTATION } from './constants';
import { createHumanitecClient } from './clients/humanitec';

export function createHumanitecPlatformApi({ token }: { token: string }): Pick<PlatformApi, "getEnvironments"> {

  return {
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
