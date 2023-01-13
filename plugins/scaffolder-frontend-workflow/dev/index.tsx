import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { scaffolderFrontendWorkflowPlugin, ScaffolderFrontendWorkflowPage } from '../src/plugin';

createDevApp()
  .registerPlugin(scaffolderFrontendWorkflowPlugin)
  .addPage({
    element: <ScaffolderFrontendWorkflowPage />,
    title: 'Root Page',
    path: '/scaffolder-frontend-workflow'
  })
  .render();
