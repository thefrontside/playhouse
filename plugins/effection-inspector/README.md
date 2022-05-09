# Effection Inspector Backstage Plugin

The [Effection Inspector][effection-inspector] feature is a plugin to Backstage,
and provides a live view of all the Effection tasks and resources that are
currently running inside your Backsage Server. This can provide powerful
insights into highly concurrent systems.

If you want to learn more about [Effection][effection] and
[Structured Concurrency][structured-concurrency],
[check out the docs][effection]

## Installation

Installing the Effection Inspector plugin requires changes to both your frontend
and backend application.

### Adding the Effection Inspector frontend plugin

The first step is to add the Effection Inspector frontend plugin to your
Backstage application.

``` text
# From your Backstage root directory
$ yarn add --cwd packages/app @frontside/plugin-effection-inspector
```

Once the package has been installed, you need to import the plugin in your app
and add a route for it.


``` tsx
// In `packages/app/src/App.tsx`:
import { InspectorPage } from '@frontside/backstage-plugin-effection-inspector';

const routes = (
  <FlatRoutes>
    {/* other routes */}
    <Route path="/effection-inspector" element={<InspectorPage />}/>
  </FlatRoutes>
);
```

Now we need the Effection Inspector Backend plugin for the frontend to work.

### Adding Effection Inspector Backend plugin

The backend plugin provides an event stream of all the concurrent events
happening inside your Backstage server that the frontend will then visualize.

Navigate to packages/backend of your Backstage app, and install the
`@frontside/plugin-effection-inspector-backend` package.

``` text
# From your Backstage root directory
yarn add --cwd packages/backend @frontside/plugin-effection-inspector-backend
```

Create a file called `effection-inspector.ts` inside
`packages/backend/src/plugins/` and add the following:

``` typescript
// In packages/backend/src/plugins/effection-inspector.ts
import { createRouter } from '@frontside/backstage-plugin-effection-inspector-backend';
import type { Router } from 'express';
import type { PluginEnvironment } from '../types';

export default async function createPlugin({
  logger,
  discovery,
}: PluginEnvironment): Promise<Router> {
  return await createRouter({ logger, discovery });
}
```

And import the plugin to `packages/backend/src/index.ts`.
There are three lines of code you'll need to add, and they should be
added near similar code in your existing Backstage backend.

``` typescript
// In packages/backend/src/index.ts
import effectionInspector from './plugins/effection-inspector';
// ...
async function main() {
  // ...
  const effectionInspectorEnv = useHotMemoize(module, () => createEnv('effectionInspector'));
  // ...
  apiRouter.use('/effection-inspector', await effectionInspector(effectionInspectorEnv));
```

That's it! You should be able to navigate to the `/effection-inspector` route of
your backstage app to see a visualization of your server.

[effection-inspector]: https://frontside.com/effection/docs/guides/inspector
[effection]: https://frontside.com/effection
[structured-concurrency]: https://vorpus.org/blog/notes-on-structured-concurrency-or-go-statement-considered-harmful/
