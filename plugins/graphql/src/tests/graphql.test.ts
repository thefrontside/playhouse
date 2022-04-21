/* eslint-disable func-names */
/* eslint-disable jest/no-standalone-expect */
import { describe, beforeAll, it } from '@effection/jest';
import { encodeId } from '../app/loaders';
import { createBackstage, GraphQLAPI } from './setupTests';

describe('querying the graphql API', () => {
  let graphql: GraphQLAPI;

  beforeAll(function* () {
    graphql = yield createBackstage({ log: true });
  });

  it.eventually('can look up a known node by id', function* () {
    const id = encodeId({
      typename: 'Website',
      kind: 'Component',
      name: 'backstage',
      namespace: 'default',
    });
    expect(

      yield graphql.query(/* GraphQL */`
        node(id: "${id}") { id }
      `),
    ).toMatchObject({ node: { id } });
  });

  it.eventually('can look up a known entity by name', function* () {
    expect(
      yield graphql.query(/* GraphQL */`
        entity(
          kind: "Component",
          name: "backstage",
          namespace: "default"
        ) { name, namespace, description }
      `),
    ).toMatchObject({
      entity: {
        name: 'backstage',
        namespace: 'default',
        description: 'An example of a Backstage application.',
      },
    });
  });

  it.eventually(
    'looks up entity in the default namespace if no namespace provided',
    function* () {
      expect(
        yield graphql.query(/* GraphQL */`
          entity(kind: "Component", name: "backstage") { name, namespace, description }
        `),
      ).toMatchObject({ entity: { name: 'backstage', namespace: 'default' } });
    },
  );

  it.eventually('can look up a known component', function* () {
    expect(
      yield graphql.query(/* GraphQL */`
        entity(kind: "Component", name: "www-artist") {
          name
          ... on Website {
            lifecycle
          }
        }
      `),
    ).toMatchObject({ entity: { name: 'www-artist', lifecycle: 'PRODUCTION' } });
  });

  it.eventually("can look up a component's owner", function* () {
    expect(
      yield graphql.query(/* GraphQL */`
        entity(kind: "Component", name: "www-artist") {
          name
          ...on Website {
            lifecycle
            owner {
              ...on Team {
                name
                email
                displayName
                picture
              }
            }
          }
        }
      `),
    ).toMatchObject({
      entity: {
        name: 'www-artist',
        lifecycle: 'PRODUCTION',
        owner: {
          name: 'team-a',
          email: 'team-a@example.com',
          displayName: null,
          picture: 'https://avatars.dicebear.com/api/identicon/team-a@example.com.svg?background=%23fff&margin=25'
        }
      }
    });
  });

  it.eventually("can look up which system component belongs to", function* () {
    expect(
      yield graphql.query(/* GraphQL */`
        entity(kind: "Component", name: "www-artist") {
          ...on Website {
            lifecycle
            system {
              ...on System {
                name
                description
              }
            }
          }
        }
      `),
    ).toMatchObject({
      entity: {
        lifecycle: 'PRODUCTION',
        system: { name: 'artist-engagement-portal', description: 'Everything related to artists' }
      }
    });
  });

  it.eventually("looks up component's parts", function* () {
    expect(
      yield graphql.query(/* GraphQL */`
        entity(kind: "Component", name: "wayback-archive") {
          name
          ...on Service {
            subComponents {
              ...on Service {
                name
              }
            }
          }
        }
      `),
    ).toMatchObject({
      entity: {
        name: 'wayback-archive',
        subComponents: [{ name: 'wayback-archive-ingestion' }, { name: 'wayback-archive-storage' }]
      }
    });
  });

  it.eventually("looks up component's apis", function* () {
    expect(
      yield graphql.query(/* GraphQL */`
        entity(kind: "Component", name: "wayback-search") {
          name
          ...on Service {
            providesApi {
              ...on Openapi { name }
            }
            consumesApi {
              ...on Openapi { name }
            }
          }
        }
      `),
    ).toMatchObject({
      entity: {
        name: 'wayback-search',
        providesApi: [{ name: 'wayback-search' }],
        consumesApi: [{ name: 'wayback-archive' }]
      }
    });
  });

  it.eventually("looks up component's dependencies", function* () {
    expect(
      yield graphql.query(/* GraphQL */`
        entity(kind: "Component", name: "artist-lookup") {
          name
          ...on Service {
            dependencies {
              ...on Database { name }
            }
          }
        }
      `),
    ).toMatchObject({
      entity: {
        name: 'artist-lookup',
        dependencies: [{ name: 'artists-db' }]
      }
    });
  });

  it.eventually("can look up components hierarchy", function* () {
    expect(
      yield graphql.query(/* GraphQL */`
        entity(kind: "Component", name: "wayback-archive-storage") {
          description
          ...on Service {
            component {
              ...on Service {
                name
                description
              }
            }
          }
        }
      `),
    ).toMatchObject({
      entity: {
        description: 'Storage subsystem of the Wayback Archive',
        component: { name: 'wayback-archive', description: 'Archive of the wayback machine' }
      }
    });
  });

  it.eventually('can look up a known user', function* () {
    expect(
      yield graphql.query(/* GraphQL */`
        entity(kind: "User", name: "janelle.dawe") {
          ...on User {
            displayName
            email
            picture
          }
        }
      `),
    ).toMatchObject({
      entity: {
        displayName: 'Janelle Dawe',
        email: 'janelle-dawe@example.com',
        picture: 'https://avatars.dicebear.com/api/avataaars/janelle-dawe@example.com.svg?background=%23fff'
      }
    });
  });

  it.eventually("looks up user's groups", function* () {
    expect(
      yield graphql.query(/* GraphQL */`
        entity(kind: "User", name: "janelle.dawe") {
          name
          ...on User {
            memberOf {
              ...on Team {
                name
                displayName
                email
              }
            }
          }
        }
      `),
    ).toMatchObject({
      entity: {
        name: 'janelle.dawe',
        memberOf: [{ name: 'team-a', displayName: null, email: 'team-a@example.com' }]
      }
    });
  });

  it.eventually('can look up a known group', function* () {
    expect(
      yield graphql.query(/* GraphQL */`
        entity(kind: "Group", name: "team-a") {
          ...on Team {
            displayName
            email
            picture
          }
        }
      `),
    ).toMatchObject({
      entity: {
        displayName: null,
        email: "team-a@example.com",
        picture: "https://avatars.dicebear.com/api/identicon/team-a@example.com.svg?background=%23fff&margin=25"
      }
    });
  });

  it.eventually('looks up group children', function* () {
    expect(
      yield graphql.query(/* GraphQL */`
        entity(kind: "Group", name: "infrastructure") {
          name
          ...on Department {
            children {
              ...on SubDepartment {
                name
                displayName
              }
            }
          }
        }
      `),
    ).toMatchObject({
      entity: {
        name: 'infrastructure',
        children: [{
          name: 'backstage',
          displayName: 'Backstage'
        }, {
          name: 'boxoffice',
          displayName: 'Box Office'
        }]
      }
    });
  });

  it.eventually('looks up group members', function* () {
    expect(
      yield graphql.query(/* GraphQL */`
        entity(kind: "Group", name: "team-a") {
          name
          ...on Team {
            members {
              ...on User {
                name
                email
              }
            }
          }
        }
      `),
    ).toMatchObject({
      entity: {
        name: 'team-a',
        members: [{
          name: 'breanna.davison',
          email: 'breanna-davison@example.com'
        }, {
          name: 'guest',
          email: 'guest@example.com'
        }, {
          name: 'janelle.dawe',
          email: 'janelle-dawe@example.com'
        }, {
          name: 'nigel.manning',
          email: 'nigel-manning@example.com'
        }]
      }
    });
  });

  it.eventually('looks up group belongings', function* () {
    expect(
      yield graphql.query(/* GraphQL */`
        entity(kind: "Group", name: "team-a") {
          name
          ...on Team {
            ownerOf {
              ...on Service { name }
              ...on Website { name }
              ...on Database { name }
              ...on Openapi { name }
              ...on System { name }
            }
          }
        }
      `),
    ).toMatchObject({
      entity: {
        name: 'team-a',
        ownerOf: [
          { name: 'spotify' },
          { name: 'wayback-archive' },
          { name: 'wayback-search' },
          { name: 'artist-lookup' },
          { name: 'wayback-archive' },
          { name: 'wayback-archive-storage' },
          { name: 'wayback-search' },
          { name: 'www-artist' },
          { name: 'artists-db' },
          { name: 'artist-engagement-portal' },
        ]
      }
    });
  });

  it.eventually("can look up a group's parent", function* () {
    expect(
      yield graphql.query(/* GraphQL */`
        entity(kind: "Group", name: "team-a") {
          ...on Team {
            parent {
              displayName
              email
              picture
              parent {
                description
                displayName
                email
                picture
                parent {
                  displayName
                  email
                  picture
                  parent {
                    displayName
                  }
                }
              }
            }
          }
        }
      `),
    ).toMatchObject({
      entity: {
        parent: {
          displayName: 'Backstage',
          email: 'backstage@example.com',
          picture: 'https://avatars.dicebear.com/api/identicon/backstage@example.com.svg?background=%23fff&margin=25',
          parent: {
            description: 'The infra department',
            displayName: null,
            email: null,
            picture: null,
            parent: {
              displayName: 'ACME Corp',
              email: 'info@example.com',
              picture: 'https://avatars.dicebear.com/api/identicon/info@example.com.svg?background=%23fff&margin=25',
              parent: null
            }
          }
        }
      }
    });
  });

  it.eventually('can look up a known system', function* () {
    expect(
      yield graphql.query(/* GraphQL */`
        entity(kind: "System", name: "artist-engagement-portal") {
          description
          ...on System {
            owner {
              ...on Team {
                name
              }
            }
          }
        }
      `),
    ).toMatchObject({ entity: { description: 'Everything related to artists', owner: { name: 'team-a' } } });
  });

  it.eventually('looks up system parts', function* () {
    expect(
      yield graphql.query(/* GraphQL */`
        entity(kind: "System", name: "podcast") {
          name
          ...on System {
            components {
              ...on Service { name }
              ...on Website { name }
            }
          }
        }
      `),
    ).toMatchObject({ entity: { name: 'podcast', components: [{ name: 'podcast-api' }, { name: 'queue-proxy' }] } });
  });

  it.eventually('can look up a known resource', function* () {
    expect(
      yield graphql.query(/* GraphQL */`
        entity(kind: "Resource", name: "artists-db") {
          description
          ...on Database {
            owner {
              ...on Team { name }
            }
            dependents {
              ...on Service { name }
            }
            systems {
              ...on System { name }
            }
          }
        }
      `),
    ).toMatchObject({
      entity: {
        description: 'Stores artist details',
        owner: { name: 'team-a' },
        dependents: [{ name: 'artist-lookup' }],
        systems: [{ name: 'artist-engagement-portal' }]
      }
    });
  });

  it.eventually('can look up a known API', function* () {
    expect(
      yield graphql.query(/* GraphQL */`
        entity(kind: "API", name: "hello-world") {
          description
          ...on Grpc {
            lifecycle
            providers {
              ...on Service {
                name
                description
              }
            }
          }
        }
      `),
    ).toMatchObject({
      entity: {
        description: 'Hello World example for gRPC',
        lifecycle: 'DEPRECATED',
        providers: [{ name: 'petstore', description: 'The Petstore is an example API used to show features of the OpenAPI spec.' }]
      }
    });
  });

  it.eventually('can look up a known location', function* () {
    expect(
      yield graphql.query(/* GraphQL */`
        entity(kind: "Location", name: "example-groups") {
          description
          ...on Location {
            targets
            target
            type
          }
        }
      `),
    ).toMatchObject({
      entity: {
        description: 'A collection of all Backstage example Groups',
        targets: [
          "./infrastructure-group.yaml",
          "./boxoffice-group.yaml",
          "./backstage-group.yaml",
          "./team-a-group.yaml",
          "./team-b-group.yaml",
          "./team-c-group.yaml",
          "./team-d-group.yaml"
        ],
        target: null,
        type: null
      }
    });
  });

  it.eventually('can look up a known template', function* () {
    expect(
      yield graphql.query(/* GraphQL */`
        entity(kind: "Template", name: "react-ssr-template") {
          description
          ...on Website {
            output
          }
        }
      `),
    ).toMatchObject({
      entity: {
        description: 'Create a website powered with Next.js',
        output: {
          links: [
            {
              title: "Repository",
              url: "${{ steps.publish.output.remoteUrl }}"
            },
            {
              title: "Open in catalog",
              icon: "catalog",
              entityRef: "${{ steps.register.output.entityRef }}"
            }
          ]
        }
      }
    });
  });
});
