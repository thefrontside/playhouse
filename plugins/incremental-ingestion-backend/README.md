# @frontside/backstage-plugin-incremental-ingestion-backend

The Incremental Ingestion Backend plugin provides Incremental Entity Provider that can be used to ingest data from sources using `delta` mutations while retaining an orphan preventing mechanism provided by `full` mutations.

## Why did we create it?

Backstage provides an [Entity Provider mechanism that has two kinds of mutations](https://backstage.io/docs/features/software-catalog/external-integrations#provider-mutations): `delta` and `full`. `delta` mutations tell Backstage Catalog which entities should be added and removed from the catalog. `full` mutation accepts a list of entities and automatically computes which entities must be removed by comparing the provided entities against existing entities to create a diff between the two sets. These two kinds of mutations are convenient for different kinds of data sources. A `delta` mutation can be used with a data source that emits UPDATE and DELETE events for its data. A `full` mutation is useful for APIs that produce fewer entities than can fit in Backstage processes' memory.

Unfortunately, these two kinds of mutations are insufficient for very large data sources for the following reasons,

1. Even when the API provides DELETE events, we still need a way to create the initial list of entities. For example, if you ingest all repositories from GitHub into Backstage and you use webhooks, you still need the initial list of entities.
2. A `delta` mutation can not guarantee that mutations will not be missed. For example, if your Backstage portal is down while receiving a DELETE event, you might miss the event which leaves your catalog in unclear state. How can you replay the missed events? Some data sources, like GitHub, provide an API for replaying missed events, but this increases complexity and is not available on all APIs.
3. Addressing the above two use case with `full` mutation is not an option on very large datasets because a `full` mutation requires that all entities are in memory to create a diff. If your data source has 100k+ records, this can easily cause your processes to run out of memory.
4. In cases when you can use `full` mutation, committing many entities into the processing pipeline fills up the processing queue and delays the processing of entities from other entity providers.

We created the Incremental Entity Provider to address all of the above issues. The Incremental Entity Provider addresses these issues with a combination of `delta` mutations and a mark-and-sweep mechanism. Instead of doing a single `full` mutation, it performs a series of bursts. At the end of each burst, the Incremental Entity Provider performs the following three operations,

1. Marks each received entity in the database.
2. Annotates each entity with `frontside/incremental-entity-provider: <entity-provider-id>` annotation.
3. Commits all of the entities with a `delta` mutation.

Incremental Entity Provider will wait a configurable interval before proceeding to the next burst.

Once the source has no more results, Incremental Entity Provider compares all entities annotated with `frontside/incremental-entity-provider: <entity-provider-id>` against all marked entities to determine which entities commited by same entity provider were not marked during the last ingestion cycle. All unmarked entities are deleted at the end of the cycle. The Incremental Entity Provider rests for a fixed internal before restarting the ingestion process.

![Diagram of execution of an Incremental Entity Provider](https://user-images.githubusercontent.com/74687/185822734-ee6279c7-64fa-46b9-9aa8-d4092ab73858.png)

This approach has the following benefits,

1. Reduced ingestion latency - each burst commits entities which are processed before the entire list is processed.
2. Stable pressure - each period between bursts provides an opportunity for the processing pipeline to settle without overwhelming the pipeline with a large number of unprocessed entities.
3. Built-in retry/backoff - Failed bursts are automatically retried with a built-in backoff interval providing an opportunity for the data source to reset its rate limits before retrying the burst.
4. Prevents orphan entities - Deleted entities are removed as with `full` mutation with a low memory footprint.

## Installation

1. Install `@frontside/backstage-plugin-incremental-ingestion-backend` in `packages/backend` with `yarn add @frontside/backstage-plugin-incremental-ingestion-backend`
2. Import `IncrementalCatalogBuilder` from `@frontside/backstage-plugin-incremental-ingestion-backend` and instantiate it with `IncrementalCatalogBuilder.create(env, builder)`. You have to pass `builder` into `IncrementalCatalogBuilder.create` function because `IncrementalCatalogBuilder` will convert an `IncrementalEntityProvider` into an `EntityProvider` and call `builder.addEntityProvider`.
  ```ts
  const builder = CatalogBuilder.create(env);
  // incremental builder receives builder because it'll register
  // incremental entity providers with the builder 
  const incrementalBuilder = IncrementalCatalogBuilder.create(env, builder);
  ```
3. Last step, add `await incrementBuilder.build()` after `await builder.build()` to ensure that all `CatalogBuider` migration run before running `incrementBuilder.build()` migrations.
  ```ts
  const { processingEngine, router } = await builder.build();

  // this has to run after `await builder.build()` so ensure that catalog migrations are completed 
  // before incremental builder migrations are executed 
  await incrementalBuilder.build();
  ```

The resuld should look something like this,

```ts
import {
  CatalogBuilder
} from '@backstage/plugin-catalog-backend';
import { ScaffolderEntitiesProcessor } from '@backstage/plugin-scaffolder-backend';
import { IncrementalCatalogBuilder } from '@frontside/backstage-plugin-incremental-ingestion-backend';
import { GithubRepositoryEntityProvider } from '@frontside/backstage-plugin-incremental-ingestion-github';
import { Router } from 'express';
import { Duration } from 'luxon';
import { PluginEnvironment } from '../types';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  
  const builder = CatalogBuilder.create(env);
  // incremental builder receives builder because it'll register
  // incremental entity providers with the builder 
  const incrementalBuilder = IncrementalCatalogBuilder.create(env, builder);

  builder.addProcessor(new ScaffolderEntitiesProcessor());

  const { processingEngine, router } = await builder.build();

  // this has to run after `await builder.build()` so ensure that catalog migrations are completed 
  // before incremental builder migrations are executed 
  await incrementalBuilder.build();

  await processingEngine.start();

  return router;
}
```

## Writing an Incremental Entity Provider

To create an Incremental Entity Provider, you need to know how to retrieve a single page of the data that you wish to ingest into the Backstage catalog. If the API has pagination and you know how to make a paginated request to that API, you'll be able to implement an Incremental Entity Provider for this API. For more information about compatibility, checkout <a href="#Compatible-Data-Source">Compatible data sources</a> section on this page.

Here is the type definition for an Incremental Entity Provider.

```ts
interface IncrementalEntityProvider<TCursor, TContext> {
  /**
   * This name must be unique between all of the entity providers
   * operating in the catalog.
   */
  getProviderName(): string;

  /**
   * Do any setup and teardown necessary in order to provide the
   * context for fetching pages. This should always invoke `burst` in
   * order to fetch the individual pages.
   *
   * @param burst - a function which performs a series of iterations
   */
  around(burst: (context: TContext) => Promise<void>): Promise<void>;

  /**
   * Return a single page of entities from a specific point in the
   * ingestion.
   *
   * @param context - anything needed in order to fetch a single page.
   * @param cursor - a uniqiue value identifying the page to ingest.
   * @returns the entities to be ingested, as well as the cursor of
   * the the next page after this one.
   */
  next(context: TContext, cursor?: TCursor): Promise<EntityIteratorResult<TCursor>>;
}
```

For tutorial, we'll write an Incremental Entity Provider that will call an imaginary API. This imaginary API will return a list of imaginary services. This imaginary API has an imaginary API client with the following interface.

```ts
interface MyApiClient {
  getServices(page: number): MyPaginatedResults<Service>
}

interface MyPaginatedResults<T> {
  items: T[];
  totalPages: number;
}

interface Service {
  name: string;
}
```

These are the only 3 methods that you need to implement. `getProviderName()` is pretty self explanatory and it's exactly same as on Entity Provider.

```ts
import { IncrementalEntityProvider, EntityIteratorResult } from '@frontside/backstage-plugin-incremental-ingestion-backend';

// this will include your pagination information, let's say our API accepts a `page` parameter.
// In this case, the cursor will include `page`
interface MyApiCursor {
  page: number;
}

// This interface describes the type of data that will be passed to your burst function.
interface MyContext {
  apiClient: MyApiClient
}

export class MyIncrementalEntityProvider implements IncrementalEntityProvider<MyApiCursor, MyContext> {
  getProviderName() {
    return `MyIncrementalEntityProvider`;
  }
}
```

`around` method is used for setup and teardown. For example, if you need to create a client that will connect to the API, you would do that here.

```ts
export class MyIncrementalEntityProvider implements IncrementalEntityProvider<Cursor, Context> {
  getProviderName() {
    return `MyIncrementalEntityProvider`;
  }

  async around(burst: (context: MyContext) => Promise<void>): Promise<void> {

    const apiClient = new MyApiClient();

    await burst({ apiClient });

    // if you need to do any teardown, you can do it here
  }
}
```

If you need to pass a token to your API, then you can create a constructor that will receive a token and use the token to setup th client.

```ts
export class MyIncrementalEntityProvider implements IncrementalEntityProvider<Cursor, Context> {
  
  token: string;
  
  construtor(token: string) {
    this.token = token;
  }

  getProviderName() {
    return `MyIncrementalEntityProvider`;
  }


  async around(burst: (context: MyContext) => Promise<void>): Promise<void> {

    const apiClient = new MyApiClient(this.token)

    await burst({ apiClient })
  }
}
```

The last step is to implement the actual `next` method that will accept the cursor, call the API, process the result and return the result.

```ts
export class MyIncrementalEntityProvider implements IncrementalEntityProvider<Cursor, Context> {
  
  token: string;
  
  construtor(token: string) {
    this.token = token;
  }

  getProviderName() {
    return `MyIncrementalEntityProvider`;
  }


  async around(burst: (context: MyContext) => Promise<void>): Promise<void> {

    const apiClient = new MyApiClient(this.token)

    await around({ apiClient })
  }

  async next(context: MyContext, cursor?: MyApiCursor = { page: 1 }): Promise<EntityIteratorResult<TCursor>> {
    const { apiClient } = context;
    const { page } = cursor;

    // call your API with the current page
    const data = await apiClient.getServices(page);

    // calculate the next page
    const nextPage = page + 1;

    // figure out if there are any more pages to fetch
    const done = nextPage > data.totalPages;

    // convert returned items into entities
    const entities = data.items.map(item => ({
      entity: {
        apiVersion: 'backstage.io/v1beta1',
        kind: 'Component',
        metadata: {
          name: item.name,
          annotations: {
            // You need to define these, otherwise they'll fail validation
            [ANNOTATION_LOCATION]: this.getProviderName(),
            [ANNOTATION_ORIGIN_LOCATION]: this.getProviderName(),
          }
        }
        spec: {
          type: 'service'
        }
      }
    }));

    // create the next cursor
    const nextCursor = {
      page: nextPage
    };

    return {
      done,
      entities,
      cursor: nextCursor
    }
  }
}
```

Now that you have your new Incremental Entity Provider, we can connect it to the catalog. 

## Adding an Incremental Entity Provider to the catalog

We'll assume you followed the <a href="#Installation">Installation</a> instructions. After you create your `incrementalBuilder`, you can instantiate your Entity Provider and pass it to the `addIncrementalEntityProvider` method.

```ts
  const incrementalBuilder = IncrementalCatalogBuilder.create(env, builder);

  // I'm assuming you're going to get your token from config
  const token = config.getString('myApiClient.token');

  const myEntityProvider = new MyIncrementalEntityProvider(token)

  incrementalBuilder.addIncrementalEntityProvider(
    myEntityProvider,
    {
      // how long should it attempt to read pages from the API
      // keep this short. Incremental Entity Provider will attempt to
      // read as many pages as it can in this time
      burstLength: Duration.fromObject({ seconds: 3 }),
      // how long should it wait between bursts?
      burstInterval: Duration.fromObject({ seconds: 3 }),
      // how long should it rest before re-ingesting again?
      restLength: Duration.fromObject({ day: 1 })
    }
  )
```

That's it!!!

## Error handling

If `around` or `next` methods throw an error, the error will show up in logs and it'll trigger the Incremental Entity Provider to try again after a backoff period. It'll keep trying until it reaches the last backoff attempt. You don't need to do anything special to handle the retry logic.

## Compatible data sources

Incemental Entity Provider is designed for data sources that provide paginated results. Each burst attempts to handle one or more pages of the query. Incremental Entity Provider will attempt to fetch as many pages as it can within a configurable burst length. At every interation, it expects to receive the next cursor that will be used to query in the next iteration. Each iteration may happen on a different replica. This has several concequences,

1. Cursor must be serializable to JSON - non-issue for most RESTful or GraphQL based APIs.
2. Client must be stateless - a client is created from scratch for each iteration to allow distributing processing over multiple replicas.

## LDAP Support

LDAP is *special*. LDAP clients are stateful and each LDAP server supports different features. Even though, Incremental Entity Provider was initial designed to ingest 100k+ users from LDAP, support for LDAP is not available out of the box because there is no way to create a stateless client. We found a workaround for this. The workaround requires deploying an LDAP Proxy which maintains a stateful client that connects to the LDAP server. Unfortunately, this is not very portable because each LDAP server is different. We might eventually open source the proxy. In the mean time, [reach out](https://frontside.com/contact) if you'd like help ingesting data from LDAP.
