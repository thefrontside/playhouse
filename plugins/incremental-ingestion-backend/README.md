# @frontside/backstage-plugin-incremental-ingestion-backend

The Incremental Ingestion Backend plugin provides Incremental Entity Provider that can be used to ingest data from sources using `delta` mutations while retaining an orphan preventing mechanism provided by `full` mutations.

## Why did we create it?

Backstage provides an [Entity Provider mechanism that has two kinds of mutations](https://backstage.io/docs/features/software-catalog/external-integrations#provider-mutations): `delta` and `full`. `delta` mutations tell Backstage Catalog which entities should be added and removed from the catalog. `full` mutation accepts a list of entities and automatically computes which entities must be removed by comparing the provided entities against existing entities to create a diff between the two sets. These two kinds of mutations are convenient for different kinds of data sources. A `delta` mutation can be used with a data source that emits UPDATE and DELETE events for its data. A `full` mutation is useful for APIs that produce fewer entities that can safely fit in Backstage processes' memory. Unfortunately, these two kinds of mutations are insufficient for very large data sources for the following reasons,

1. Even when the API provides DELETE events, we still need a way to create the initial list of entities. For example, if you ingest all repositories from GitHub into Backstage and you use webhooks, you still need the initial list of entities.
2. A `delta` mutation can not guarantee that mutations will not be missed. For example, if your Backstage portal is down while receiving a DELETE event, you might miss the event which leaves your catalog in unclear state. How can you replay the missed events? Some data sources, like GitHub, provide an API for replaying missed events, but this increases complexity and is not available on all APIs.
3. Addressing the above two use case with `full` mutation is not an option on very large datasets because a `full` mutation requires that all entities are in memory for the diff to be performed. If your data source has 100k+ records, this can easily cause your processes to run out of memory.
4. In cases when you can use `full` mutation, committing many entities into the processing pipeline fills up the processing queue and delays the processing of entities from other entity providers.

We created the Incremental Entity Provider to address all of the above issues. The Incremental Entity Provider addresses these issues with a combination of `delta` mutations and a mark-and-sweep mechanism. Instead of doing a single `full` mutation, it performs a series of bursts. At the end of each burst, the Incremental Entity Provider performs the following three operations,

1. Marks each recieved entity in the database.
2. Annotates each entity with `frontside.com/incremental-entity-provider: <entity-provider-id>` annotation.
3. Commits all of the entities with a `delta` mutation.

Incremental Entity Provider will wait a configurable interval before proceeding to the next burst.

Once the source has no more results, Incremental Entity Provider compares all entities annotated with `frontside.com/incremental-entity-provider: <entity-provider-id>` against all marked entities to determine which entities commited by same entity provider were not marked during the last ingestion cycle. All unmarked entities are deleted at the end of the cycle. The Incremental Entity Provider rests for a fixed internal before restarting the ingestion process.

![Diagram of execution of an Incremental Entity Provider](https://user-images.githubusercontent.com/74687/185822734-ee6279c7-64fa-46b9-9aa8-d4092ab73858.png)

This approach has the following benefits,

1. Reduced ingestion latency - each burst commits entities which are processed before the entire list is processed.
2. Stable pressure - each period between bursts provides an opportunity for the processing pipeline to settle without overwhelming the pipeline with a large number of unprocessed entities.
3. Built-in retry/backoff - Failed bursts are automatically retried with a built-in backoff interval providing an opportunity for the data source to reset its rate limits before retrying the burst.
4. Prevents orphan entities - Deleted entities are removed as with `full` mutation with a low memory footprint.

## Compatible data sources

Incemental Entity Provider is designed for data sources that provide paginated results. Each burst attempts to handle one or more pages of the query. Incremental Entity Provider will attempt to fetch as many pages as it can within a configurable burst length. At every interation, it expects to receive the next cursor that will be used to query in the next iteration. Each iteration may happen on a different replica. This has several concequences,

1. Cursor must be serializable to JSON - non-issue for most RESTful or GraphQL based APIs.
2. Client must be stateless - a client is created from scratch for each iteration to allow distributing processing over multiple replicas.

## LDAP Support

LDAP is *special*. LDAP clients are stateful and each LDAP server supports different features. Even though, Incremental Entity Provider was initial designed to ingest 100k+ users from LDAP, support for LDAP is not available out of the box because there is no way to create a stateless client. We found a workaround for this. The workaround requires deploying an LDAP Proxy which maintains a stateful client that connects to the LDAP server. Unfortunately, this is not very portable because each LDAP server is different. We might eventually open source the proxy. In the mean time, [reach out](https://frontside.com/contact) if you'd like help ingesting data from LDAP.