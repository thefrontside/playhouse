# @frontside/backstage-plugin-humanitec

`@frontside/backstage-plugin-humanitec` is a work-in-progress plugin for the backstage frontend. It will display all of the different environments plus its pods and external dependencies of the workloads you specify.

## Installation

First install the plugin to your backstage app:
```
yarn workspace app @frontside/backstage-plugin-humanitec
```

Import `HumanitecPage` and add it as a route (`./packages/app/src/App.tsx`):
```diff
+ import { HumanitecPage } from '@frontside/backstage-plugin-humanitec';
...
const routes = (
  <FlatRoutes>
    ...
+   <Route path="/humanitec" element={<HumanitecPage />}/>
  </FlatRoutes>
)
```

Then in your Entity Page (`./packages/app/src/components/catalog/EntityPage.tsx`) add the `HumanitecCardComponent`:
```diff
+ import { HumanitecCardComponent } from '@frontside/backstage-plugin-humanitec';
...
const overviewContent = (
  <Grid container>
    ...
+   <Grid item>
+     <HumanitecCardComponent />
+   </Grid>
  </Grid>
)
```

> This will create a Humanitec section for all of your Backstage `Components`. This is just a temporary solution; we'll eventually create a separate page for Humanitec components.

Create a yaml file to specify the workloads you want to display:
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

Lastly in your `./app-config.yaml`, add the proxy for `humanitec` and create a new catalog locations entry for the file you just created:
```diff
proxy:
+  '/humanitec':
+    target: 'https://api.humanitec.io'
+    headers:
+      Authorization: ${HUMANITEC_TOKEN}
catalog:
  locations:
+    - type: file
+      target: ../../catalog-humanitec-workloads.yaml
```

When you start your backstage app be sure to pass in `HUMANITEC_TOKEN` that you must generate from your Humanitec dashboard.
