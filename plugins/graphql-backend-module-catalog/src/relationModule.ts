import { createBackendModule } from '@backstage/backend-plugin-api';
import { catalogServiceRef } from '@backstage/plugin-catalog-node/alpha';
import {
  graphqlContextExtensionPoint,
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
        context: graphqlContextExtensionPoint,
      },
      async init({ catalog, modules, loaders, context }) {
        modules.addModules([Relation]);
        loaders.addLoaders(createCatalogLoader(catalog));
        context.setContext(ctx => ({ ...ctx, catalog }));
      },
    });
  },
});
