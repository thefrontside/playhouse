import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { humanitecPlugin } from '../src/plugin';

createDevApp()
  .registerPlugin(humanitecPlugin)
  .addPage({
    element: <></>,
    title: 'Root Page',
    path: '/humanitec'
  })
  .render();
