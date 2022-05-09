import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { inspectorPlugin, InspectorPage } from '../src/plugin';

createDevApp()
  .registerPlugin(inspectorPlugin)
  .addPage({
    element: <InspectorPage />,
    title: 'Root Page',
    path: '/inspector'
  })
  .render();
