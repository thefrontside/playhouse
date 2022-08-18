# batch-loader

Welcome to the plugin for Backstage that exposes a batch loading API for data stored in the Backstage catalog.

## Getting started

```
yarn add @frontside/backstage-plugin-batch-loader
```

## Usage

```js
const entities = await batchLoader.getEntitiesByRefs(['group:default/team-a', 'group:default/team-b', 'group:default/team-c']);
```
