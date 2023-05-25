import { Overrides } from '@material-ui/core/styles/overrides';
import { TaskProgressClassKey } from './components/TaskProgress/TaskProgress';
import { StyleRules } from '@material-ui/core';
import { type WorkflowProps } from '@backstage/plugin-scaffolder-react/alpha';

export * from './components/WorkflowButton/types';

export type PluginEmbeddedScaffolderComponentsNameToClassKey = {
  EmbeddedScaffolderTaskProgress: TaskProgressClassKey;
};

export type EmbeddedScaffolderOverrides = Overrides & {
  [Name in keyof PluginEmbeddedScaffolderComponentsNameToClassKey]?: Partial<
    StyleRules<PluginEmbeddedScaffolderComponentsNameToClassKey[Name]>
  >;
};

export type OnCompleteArgs = Parameters<WorkflowProps['onCreate']>[0];
