import { stringifyEntityRef } from '@backstage/catalog-model';
import { TemplateParameterSchema } from '@backstage/plugin-scaffolder-react';
import { useTemplateParameterSchema } from '@backstage/plugin-scaffolder-react/alpha';

type WorkflowManifest = Omit<ReturnType<typeof useTemplateParameterSchema>, 'manifest'> & {
  manifest?: TemplateParameterSchema;
}

export function useWorkflowManifest({ namespace, name }: { namespace?: string; name: string; }): WorkflowManifest {
  const templateRef = stringifyEntityRef({
    kind: 'Template',
    namespace: namespace,
    name,
  });
  
  return useTemplateParameterSchema(templateRef);
}