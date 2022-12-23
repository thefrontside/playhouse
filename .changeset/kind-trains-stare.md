---
'@frontside/backstage-plugin-batch-loader': minor
'@frontside/backstage-plugin-graphql': minor
'backend': patch
---

Replacing batch-loader with getEntitiesByRefs from Backtage Catalog Client

Backstage Catalog REST API is now providing an endpoint for querying entities by refs.
This was in introduced in https://github.com/backstage/backstage/pull/14354 and 
it's available via the [Catalog API Client getEntitiesByRefs method](https://backstage.io/docs/reference/catalog-client.catalogapi.getentitiesbyrefs).

This changes makes our `@frontside/backstage-plugin-batch-loader` unnecessary. In this release, we're deprecating
`@frontside/backstage-plugin-batch-loader` and replacing it with native loader.

You'll need to change your graphql plugin to pass the catalog client to the GraphQL plugin router.
