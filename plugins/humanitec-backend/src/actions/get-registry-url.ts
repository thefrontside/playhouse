import { createTemplateAction } from '@backstage/plugin-scaffolder-backend';

interface HumanitecRegistryUrlAction {
  registryUrl: string
}

export function createHumanitecApp({ registryUrl }: HumanitecRegistryUrlAction) {
  return createTemplateAction<{ appId: string; }>({
    id: 'humanitec:get_registry_url',
    handler: () => registryUrl,
  });
}
