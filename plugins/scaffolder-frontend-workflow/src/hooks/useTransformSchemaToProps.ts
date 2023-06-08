import { LayoutOptions } from "@backstage/plugin-scaffolder-react";
import { ParsedTemplateSchema } from "@backstage/plugin-scaffolder-react/alpha";

interface Options {
  layouts?: LayoutOptions[];
}

export function useTransformSchemaToProps (
  step: ParsedTemplateSchema,
  options: Options = {},
): ParsedTemplateSchema {
  const { layouts = [] } = options;
  const objectFieldTemplate = step?.uiSchema['ui:ObjectFieldTemplate'] as
    | string
    | undefined;

  if (typeof objectFieldTemplate !== 'string') {
    return step;
  }

  const Layout = layouts.find(
    layout => layout.name === objectFieldTemplate,
  )?.component;

  if (!Layout) {
    return step;
  }

  return {
    ...step,
    uiSchema: {
      ...step.uiSchema,
      ['ui:ObjectFieldTemplate']: Layout,
    },
  };
};