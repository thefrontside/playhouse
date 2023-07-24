import React from 'react';
import { Navigate, Route } from 'react-router';
import { apiDocsPlugin, ApiExplorerPage } from '@backstage/plugin-api-docs';
import {
  CatalogEntityPage,
  CatalogIndexPage,
  catalogPlugin,
} from '@backstage/plugin-catalog';
import {
  CatalogImportPage,
  catalogImportPlugin,
} from '@backstage/plugin-catalog-import';
import { scaffolderPlugin } from '@backstage/plugin-scaffolder';
import { NextScaffolderPage } from '@backstage/plugin-scaffolder/alpha';
import { SearchPage } from '@backstage/plugin-search';
import { TechRadarPage } from '@backstage/plugin-tech-radar';
import {
  DefaultTechDocsHome,
  TechDocsIndexPage,
  techdocsPlugin,
  TechDocsReaderPage,
} from '@backstage/plugin-techdocs';
import { TechDocsAddons } from '@backstage/plugin-techdocs-react';
import { ReportIssue } from '@backstage/plugin-techdocs-module-addons-contrib';
import {
  ProviderSettingsItem,
  UserSettingsPage,
} from '@backstage/plugin-user-settings';
import { apis } from './apis';
import { entityPage } from './components/catalog/EntityPage';
import { searchPage } from './components/search/SearchPage';
import { Root } from './components/Root';

import { AlertDisplay, OAuthRequestDialog } from '@backstage/core-components';
import { createApp } from '@backstage/app-defaults';
import { AppRouter, FlatRoutes } from '@backstage/core-app-api';
import { orgPlugin } from '@backstage/plugin-org';
import { InspectorPage } from '@frontside/backstage-plugin-effection-inspector';
import { GraphiQLPage } from '@backstage/plugin-graphiql';

import { SignInPage } from '@backstage/core-components';
import { auth0AuthApiRef } from './internal';
import Star from '@material-ui/icons/Star';
import { githubAuthApiRef } from '@backstage/core-plugin-api';
import { SecretsContextProvider } from '@backstage/plugin-scaffolder-react';

const app = createApp({
  apis,
  components: {
    SignInPage: props => (
      <SignInPage
        {...props}
        auto
        provider={{
          id: 'auth0-auth-provider',
          title: 'Auth0',
          message: 'Sign in using Auth0',
          apiRef: auth0AuthApiRef,
        }}
      />
    ),
  },
  bindRoutes({ bind }) {
    bind(catalogPlugin.externalRoutes, {
      createComponent: scaffolderPlugin.routes.root,
      viewTechDoc: techdocsPlugin.routes.docRoot,
    });
    bind(apiDocsPlugin.externalRoutes, {
      registerApi: scaffolderPlugin.routes.root,
    });
    bind(scaffolderPlugin.externalRoutes, {
      registerComponent: catalogImportPlugin.routes.importPage,
    });
    bind(orgPlugin.externalRoutes, {
      catalogIndex: catalogPlugin.routes.catalogIndex,
    });
  },
});

const routes = (
  <FlatRoutes>
    <Navigate key="/" to="catalog" />
    <Route path="/catalog" element={<CatalogIndexPage />} />
    <Route
      path="/catalog/:namespace/:kind/:name"
      element={<CatalogEntityPage />}
    >
      {entityPage}
    </Route>
    <Route path="/docs" element={<TechDocsIndexPage />}>
      <DefaultTechDocsHome />
    </Route>
    <Route
      path="/docs/:namespace/:kind/:name/*"
      element={<TechDocsReaderPage />}
    >
      <TechDocsAddons>
        <ReportIssue />
      </TechDocsAddons>
    </Route>
    <Route path="/create" element={<NextScaffolderPage FormProps={{ noHtml5Validate: true }} />} />
    <Route path="/api-docs" element={<ApiExplorerPage />} />
    <Route
      path="/tech-radar"
      element={<TechRadarPage width={1500} height={800} />}
    />
    <Route path="/catalog-import" element={<CatalogImportPage />} />
    <Route path="/search" element={<SearchPage />}>
      {searchPage}
    </Route>
    <Route
      path="/settings"
      element={
        <UserSettingsPage
          providerSettings={
            <>
              <ProviderSettingsItem
                title="Auth0"
                description="Provides sign-in via Auth0"
                apiRef={auth0AuthApiRef}
                icon={Star}
              />
              <ProviderSettingsItem
                title="GitHub"
                description="Provides authentication towards GitHub APIs"
                apiRef={githubAuthApiRef}
                icon={Star}
              />
            </>
          }
        />
      }
    />
    <Route path="/effection-inspector" element={<InspectorPage />} />
    <Route path="/graphiql" element={<GraphiQLPage />} />
  </FlatRoutes>
);

export default app.createRoot(
  <SecretsContextProvider>
    <AlertDisplay />
    <OAuthRequestDialog />
    <AppRouter>
      <Root>{routes}</Root>
    </AppRouter>
  </SecretsContextProvider>
);
