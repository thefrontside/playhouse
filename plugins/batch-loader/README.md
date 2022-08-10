# batch-loader

Welcome to the plugin for Backstage that exposes a batch loading API for data stored in the Backstage catalog.

## Getting started

```
yarn add @frontside/backstage-plugin-batch-loader
```

## Initialization

First you create catalog backend plugin:
```js
const builder = await CatalogBuilder.create(env);
await builder.build();
```

Then initiate batch loader plugin:

```js
const batchLoader = new BatchLoader({ logger, databaseManager });
await batchLoader.init();
```

## Usage

```js
const entities = await batchLoader.getEntitiesByRefs(['group:default/team-a', 'group:default/team-b', 'group:default/team-c']);
```
