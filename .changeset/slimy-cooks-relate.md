---
'@frontside/backstage-plugin-graphql-backend-module-catalog': patch
'@frontside/backstage-plugin-graphql-backend': patch
---

Make module default exports to allow using import syntax

This change allows to use import syntax to load modules

```ts
import { createBackend } from '@backstage/backend-defaults';
- import { graphqlPlugin } from '@frontside/backstage-plugin-graphql-backend';
- import { graphqlModuleCatalog } from '@frontside/backstage-plugin-graphql-backend-module-catalog';

const backend = createBackend();


- backend.add(graphqlPlugin());
+ backend.add(import('@frontside/backstage-plugin-graphql-backend'));
- backend.add(graphqlModuleCatalog());
+ backend.add(import('@frontside/backstage-plugin-graphql-backend-module-catalog'));

backend.start();
```
