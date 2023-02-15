// packages/app/src/scaffolder/ValidateKebabCase/extensions.ts

/*
  This is where the magic happens and creates the custom field extension.

  Note that if you're writing extensions part of a separate plugin,
  then please use `scaffolderPlugin.provide` from there instead and export it part of your `plugin.ts` rather than re-using the `scaffolder.plugin`.
*/

import { scaffolderPlugin } from '@backstage/plugin-scaffolder';
import { createScaffolderFieldExtension } from '@backstage/plugin-scaffolder-react';
import { GithubQuery } from './GithubQueryExtension';

export const GithubQueryFieldExtension = scaffolderPlugin.provide(
  createScaffolderFieldExtension({
    name: 'GithubQuery',
    component: GithubQuery,
  }),
);
