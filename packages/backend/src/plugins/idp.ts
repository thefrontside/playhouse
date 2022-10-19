import type { Router } from 'express';
import { createRouter } from '@frontside/backstage-plugin-platform-backend';
import { createHumanitecPlatformApi } from '@frontside/backstage-plugin-humanitec-common';
import { PluginEnvironment } from '../types';
import { Entity } from '@backstage/catalog-model';

export default async function createPlugin({
  config,
  logger,
  discovery,
  catalog,
}: PluginEnvironment): Promise<Router> {
  return await createRouter({
    executableName: 'idp',
    logger,
    discovery,
    appURL: `${config.getString('app.baseUrl')}/platform`,
    catalog,
    platform: {
      async getRepositoryUrls(ref) {
        const entity = await ref.load();

        if (entity) {
          const slug = getGithubProjectSlug(entity);
          return {
            ssh: `git@github.com:${slug}.git`,
            https: `https://github/${slug}.git`
          }
        }

        return null;
      },
      async getRepositories() {
        const { items: entities } = await catalog.getEntities();

        const repositories = entities.flatMap(entity => {
          const slug = getGithubProjectSlug(entity);
          if (slug) {
            return [{
              componentRef: getComponentRef(entity),
              slug,
              description: entity.metadata.description,
              url: `https://github/${slug}`,
            }]
          }
          return [];
        });
        return {
          hasNextPage: false,
          hasPreviousPage: false,
          beginCursor: '',
          endCursor: '',
          items: repositories.map(r => ({
            cursor: '',
            value: r
          }))
        }
      },
      ...createHumanitecPlatformApi({
        token: config.getString('humanitec.token'),
      }),
    },
  });
}

function getGithubProjectSlug(entity: Entity) {
  return entity.metadata
    && entity.metadata.annotations
    && entity.metadata.annotations["github.com/project-slug"];
}

function getComponentRef(entity: Entity) {
  return [
    entity.kind !== 'Component' ? entity.kind.toLowerCase() : '',
    entity.metadata.namespace && entity.metadata.namespace !== 'default' ? entity.metadata.namespace : '',
    entity.metadata.name
  ].join('')
}
