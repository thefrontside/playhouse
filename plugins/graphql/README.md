# @frontside/backstage-plugin-graphql

> **Status**
> Alpha - this plugin is in early stages but it already includes many design features that came from our experience implementing GraphQL API for Backstage with our clients. You should expect the schema provided by this plugin to change because we're missing a number of important features.

Backstage GraphQL Plugin adds a GraphQL API to a Backstage developer portal. The GraphQL API behaves like a gateway to provide a single API for a growing number of features provided by Backstage. It includes the following features,

1. Graph schema - easily query relationships between data in the catalog.
2. Schema-based resolvers - add field resolvers using directives without requiring JavaScript.
3. Supports Node 

## Getting started

```
yarn add @frontside/backstage-plugin-graphql
```
