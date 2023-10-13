import { createBackendModule } from '@backstage/backend-plugin-api';
import { catalogServiceRef } from '@backstage/plugin-catalog-node/alpha';
import {
  graphqlLoadersExtensionPoint,
  graphqlModulesExtensionPoint,
} from '@frontside/backstage-plugin-graphql-backend';
import { createCatalogLoader } from './entitiesLoadFn';
import { Relation } from './relation/relation';

/** @public */
export const graphqlModuleRelationResolver = createBackendModule({
  pluginId: 'graphql',
  moduleId: 'relationResolver',
  register(env) {
    env.registerInit({
      deps: {
        catalog: catalogServiceRef,
        modules: graphqlModulesExtensionPoint,
        loaders: graphqlLoadersExtensionPoint,
      },
      async init({ catalog, modules, loaders }) {
        modules.addModules([Relation]);
        loaders.addLoaders(createCatalogLoader(catalog));
      },
    });
  },
});
