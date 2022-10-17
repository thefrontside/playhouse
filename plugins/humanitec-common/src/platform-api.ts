import type { PlatformApi } from '@frontside/backstage-plugin-platform-backend';
import type { Entity } from '@backstage/catalog-model';

import { HUMANITEC_APP_ID_ANNOTATION, HUMANITEC_ORG_ID_ANNOTATION } from './constants';
import { createHumanitecClient } from './clients/humanitec';

export function createHumanitecPlatformApi({ token }: { token: string }): Pick<PlatformApi, "getEnvironments"> {

  return {
    async getEnvironments(ref) {
      let entity = await ref.load();
      let { appId, orgId } = getHumanitecMetadata(entity);
      let client = createHumanitecClient({ token, orgId });
      let environments = await client.getEnvironments(appId);
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
  let orgId = entity.metadata.annotations[HUMANITEC_ORG_ID_ANNOTATION];
  let appId = entity.metadata.annotations[HUMANITEC_APP_ID_ANNOTATION];

  if (!orgId) {
    throw new Error(`${entity.kind}:${entity.metadata.name} is not a humanitec entity`);

  }
  if (!appId) {
    throw new Error(`${entity.kind}:${entity.metadata.name} is not a humanitec entity`);

  }
  return { orgId, appId };
}
