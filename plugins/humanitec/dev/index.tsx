import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { humanitecPlugin, HumanitecPage } from '../src/plugin';

createDevApp()
  .registerPlugin(humanitecPlugin)
  .addPage({
    element: <HumanitecPage />,
    title: 'Root Page',
    path: '/humanitec'
  })
  .render();
