import { createBackendModule, coreServices } from '@backstage/backend-plugin-api';
import { catalogServiceRef } from '@backstage/plugin-catalog-node/alpha';
import {
  graphqlContextExtensionPoint,
  graphqlLoadersExtensionPoint,
  graphqlModulesExtensionPoint,
} from '@frontside/backstage-plugin-graphql-backend';
import { createCatalogLoader } from './entitiesLoadFn';
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
        context: graphqlContextExtensionPoint,
        tokenManager: coreServices.tokenManager,
      },
      async init({ catalog, modules, loaders, context, tokenManager }) {
        modules.addModules([Catalog]);
        loaders.addLoaders(createCatalogLoader(catalog, tokenManager));
        context.setContext(ctx => ({ ...ctx, catalog }));
      },
    });
  },
});
