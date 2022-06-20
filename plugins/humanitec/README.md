# @frontside/backstage-plugin-humanitec

`@frontside/backstage-plugin-humanitec` is a plugin for the Backstage frontend app. It shows information about environments, workloads and resources on an entity page.

![screenshot](./screenshot.png)

## Requirements

This plugin requires `@frontside/backstage-plugin-humanitec-backend` because it connects to the backend to make requests to the Humanitec API.

## Installation

First, install the plugin to your backstage app:

```bash
yarn workspace app add @frontside/backstage-plugin-humanitec
```

Then in your Entity Page (`./packages/app/src/components/catalog/EntityPage.tsx`) add the `HumanitecCardComponent`:

```diff
+ import { HumanitecCardComponent } from '@frontside/backstage-plugin-humanitec';
...
const overviewContent = (
  <Grid container>
    ...
+   <Grid item md={6}>
+     <HumanitecCardComponent />
+   </Grid>
  </Grid>
)
```

Add annotations to types that have Humanitec apps display:

```yaml
# ./catalog-humanitec-workloads.yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: name-of-application-workload # 🚨 CHANGE
  description: Humanitec Workload Environments
  annotations:
    "humanitec.com/orgId": "my-humanitec-organization" # 🚨 CHANGE
    "humanitec.com/appId": "my-humanitec-application" # 🚨 CHANGE
spec:
  type: service
  owner: john@example.com
  lifecycle: experimental
```

Lastly in your `./app-config.yaml`, add configuration to `humanitec`:

```diff
humanitec:
  orgId: my-humanitec-organization
  token: ${HUMANITEC_TOKEN} # without Bearer
```

When you start your backstage app be sure to pass in `HUMANITEC_TOKEN` that you must generate from your Humanitec dashboard.
