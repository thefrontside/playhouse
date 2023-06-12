import { characterTextField } from './AsyncFieldExtension';
import { scaffolderPlugin } from '@backstage/plugin-scaffolder';
import { createNextScaffolderFieldExtension } from '@backstage/plugin-scaffolder-react/alpha';

export const configuredFieldExtensions = [characterTextField].map(extension =>
  scaffolderPlugin.provide(createNextScaffolderFieldExtension(extension)),
);
