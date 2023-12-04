import { characterTextField } from './AsyncFieldExtension';
import { scaffolderPlugin } from '@backstage/plugin-scaffolder';
import { createScaffolderFieldExtension } from '@backstage/plugin-scaffolder-react';

export const configuredFieldExtensions = [characterTextField].map(extension =>
  scaffolderPlugin.provide(createScaffolderFieldExtension(extension)),
);
