import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { platformPlugin, PlatformPage } from '../src/plugin';

createDevApp()
  .registerPlugin(platformPlugin)
  .addPage({
    element: <PlatformPage />,
    title: 'Root Page',
    path: '/platform'
  })
  .render();
