import { createBackendModule } from '@backstage/backend-plugin-api';
import { catalogServiceRef } from '@backstage/plugin-catalog-node/alpha';
import {
  graphqlLoadersExtensionPoint,
  graphqlModulesExtensionPoint,
} from '@frontside/backstage-plugin-graphql-backend';
import { createEntitiesLoadFn } from './entitiesLoadFn';
import { CATALOG_SOURCE } from './constants';
import { Catalog } from './catalog/catalog';

/** @public */
export const graphqlModuleCatalog = createBackendModule({
  pluginId: 'graphql',
  moduleId: 'catalog',
  register(env) {
    env.registerInit({
      deps: {
        catalog: catalogServiceRef,
        modules: graphqlModulesExtensionPoint,
        loaders: graphqlLoadersExtensionPoint,
      },
      async init({ catalog, modules, loaders }) {
        modules.addModules([Catalog]);
        loaders.addLoaders({ [CATALOG_SOURCE]: createEntitiesLoadFn(catalog) });
      },
    });
  },
});
