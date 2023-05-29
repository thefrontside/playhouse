# @frontside/scaffolder-yaml-actions

This package provides a collection of actions 

## Installation

1. Add `@frontside/scaffolder-yaml-actions` to `packages/backend/package.json`
2. Add the following code to `packages/backend/src/plugins/scaffolder.ts`

```ts
import { createYamlSetAction } from '@frontside/scaffolder-yaml-actions';

export default async function createPlugin({
  logger,
  config,
  database,
  reader,
  discovery,
  identity
}: PluginEnvironment): Promise<Router> {
  const catalogClient = new CatalogClient({ discoveryApi: discovery });
  const integrations = ScmIntegrations.fromConfig(config);
  const builtInActions = createBuiltinActions({
    integrations,
    catalogClient,
    config: config,
    reader: reader,
  });
  const actions = [
    ...builtInActions,
    createYamlSetAction({
      logger, 
      integrations,
      reader,
    }),
   ];
  return await createRouter({
    logger,
    config,
    database,
    catalogClient,
    identity,
    reader,
    actions,
  });
}
```

## API

### `yaml:set`

Set the contents of a YAML document. This action takes an URL of YAML document, 
downloads it using `fetch:plain`, apply the change to the YAML document and saves
the change in the workspace.

Note: Ideally, we'd could use `fetch:plain:file` in the workflow without executing it in the action. Unfortunately, this is not possible because `fetch:plain:file` doesn't work correctly with GitHub right now due to https://github.com/backstage/backstage/issues/17072. The current action relies on `fetch:plain` to download the entire directory which is quite heavy for editing a single file.

**Input:**

* `url` [*string*] - URL of the YAML document [example: https://github.com/backstage/backstage/tree/master/catalog-info.yaml]
* `path` [*string*] - the path of the property to set [example: metadata.name]
* `value` [*string* | *number* | *null] - value to set
* entityRef [string, optional] - entity ref of entity to update in case YAML file contains multiple documents

**Output:**

* `repoUrl` [string] - URL string used to identify repository
* `filePath` [string] - path of updated file relative to the root
* `path` [string] - directory name where the file is located
