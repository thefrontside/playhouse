import { Overrides } from "@material-ui/core/styles/overrides";
import { TaskProgressClassKey } from "./components/TaskProgress/TaskProgress";
import { StyleRules } from "@material-ui/core";

export type PluginEmbeddedScaffolderComponentsNameToClassKey = {
  EmbeddedScaffolderTaskProgress: TaskProgressClassKey;
}

export type EmbeddedScaffolderOverrides = Overrides & {
  [Name in keyof PluginEmbeddedScaffolderComponentsNameToClassKey]?: Partial<
    StyleRules<PluginEmbeddedScaffolderComponentsNameToClassKey[Name]>
  >
}