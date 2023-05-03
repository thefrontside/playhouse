---
'@frontside/backstage-plugin-scaffolder-workflow': patch
---

To fix a bug in one of our client's Backstage sites that use EmbeddedScaffolder where the results page doesn't show the logs. This is happening because the page doesn't properly take full height and automatically adjust the height of the log area. 

1. Use `makeStyles` to create a style that can be overwritten by ovewritting style name `EmbeddedScaffolderTaskProgress`
2. Added padding bottom to TaskSteps to separate it from step output
3. Added `flexGrow: 2` to log container box
4. Added export for EmbeddedScaffolderOverrides with types for TaskProgress