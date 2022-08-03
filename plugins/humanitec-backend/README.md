# @frontside/backstage-plugin-humanitec-backend

`@frontside/backstage-plugin-humanitec-backend` is a plugin for the Backstage backend app. It provides a route that `@frontside/backstage-plugin-humanitec` will use to connect to Humanitec API and scaffolder actions.

## Installation

1. Install `@frontside/backstage-plugin-humanitec-backend` plugin with,

```bash
yarn workspace backend add @frontside/backstage-plugin-humanitec-backend
```

2. Create `./packages/backend/src/plugins/humanitec.ts` with the following content,

```ts
import { createRouter } from '@frontside/backstage-plugin-humanitec-backend';
import { Router } from 'express';
import { PluginEnvironment } from '../types';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  return await createRouter({
    logger: env.logger,
    config: env.config,
  });
}
```

3. Add `humanitec` api route to `./packages/backend/src/index.ts`.

```diff
# Import humanitec plugin from `./plugins/humanitec.ts`
import search from './plugins/search';
+ import humanitec from './plugins/humanitec';

# Create Humanitec environment
const searchEnv = useHotMemoize(module, () => createEnv('search'));
+ const humanitecEnv = useHotMemoize(module, () => createEnv('humanitec'));

# Add Humanitec to the router
apiRouter.use('/search', await search(searchEnv));
+ apiRouter.use('/humanitec', await humanitec(humanitecEnv));
```

4. Add configuration to `app-config.yaml`

```diff
humanitec:
  orgId: the-frontside-software-inc
  token: ${HUMANITEC_TOKEN}
```

## Scaffolder Actions

This plugin provides the following scaffolder actions,

### create-app

`create-app` will create an app in Humanitec with specific workloads and automation. 

#### Installation

To make this action available, you can add it to your scaffolder plugin configuration in `./packages/backend/src/plugins/scaffolder.ts`

```diff
# import createHumanitecApp action
+ import { createHumanitecApp } from "@frontside/backstage-plugin-humanitec-backend";

# register the action
  const actions = [
    ...builtInActions,
    createHumanitecApp({
+     orgId: config.getString('humanitec.orgId'),
+     token: config.getString('humanitec.token')
    })
  ];
```

### Usage

Add the action to your template,

```diff
+    - name: Create Humanitec App
+      id: humanitec-create-app
+      action: humanitec:create-app
+      input:
+        setupFile: humanitec-apps.yaml
+        appId: ${{ parameters.componentName }}
```

### setupFile parameter

`humanitec:create-app` needs to know what workloads to create in the Humanitec App. In the future, workload configuration will be handled using [paws.sh](https://paws.sh), in the mean time, `humanitec:create-app` expects to read an YAML file where it expects to find information about the payload. By default, this file is called `humanitec-app.yaml` and can be changed by specifying `setupFile` parameter.

Here is an example of such a file,

```yaml
---
id: ${{values.componentName | dump}}
name: ${{values.componentName | dump}}

environments:
  development:
    metadata:
      env_id: development
      name: Initial deployment

    modules:
      ${{values.componentName | dump}}:
        externals:
          http:
            type: dns
        profile: humanitec/default-module
        spec:
          containers:
            ${{values.componentName | dump}}:
              id: ${{values.componentName}}
              image: ${{values.registryUrl}}/${{values.componentName}}:dummy
              resources:
                limits:
                  cpu: 0.25
                  memory: 256Mi
                requests:
                  cpu: 0.025
                  memory: 64Mi
              variables: {}
              volume_mounts: {}
              files: {}
          ingress:
            rules:
              externals.http:
                http:
                  "/":
                    port: 9898
                    type: prefix

# automations that will be created
# see https://api-docs.humanitec.com/#tag/AutomationRule/paths/~1orgs~1{orgId}~1apps~1{appId}~1envs~1{envId}~1rules/post
automations:
  development:
    - active: true
      exclude_images_filter: false
      images_filter: []
      type: update
      update_to: branch
```
