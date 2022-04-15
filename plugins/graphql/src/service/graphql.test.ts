/* eslint-disable func-names */
/* eslint-disable jest/no-standalone-expect */
import { describe, beforeAll, it } from '@effection/jest';
import { encodeId } from '../app/loaders';
import { createBackstage, GraphQLAPI } from '../setupTests';

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
      yield graphql.query({
        node: {
          __args: { id },
          id: true,
        },
      }),
    ).toMatchObject({ node: { id } });
  });

  it.eventually('can look up a known entity by name', function* () {
    expect(
      yield graphql.query({
        entity: {
          __args: {
            kind: 'Component',
            name: 'backstage',
            namespace: 'default',
          },
          name: true,
          namespace: true,
          description: true,
        },
      }),
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
        yield graphql.query({
          entity: {
            __args: { kind: 'Component', name: 'backstage' },
            name: true,
            namespace: true,
            description: true,
          },
        }),
      ).toMatchObject({ entity: { name: 'backstage', namespace: 'default' } });
    },
  );

  it.eventually('looks up entity annotations and labels', function* () {
    expect(
      yield graphql.query({
        entity: {
          __args: { kind: 'Component', name: 'www-artist' },
          name: true,
          annotations: { key: true, value: true },
          labels: { key: true, value: true }
        },
      }),
    ).toMatchObject({
      entity: {
        name: 'www-artist',
        labels: null,
        annotations: [{
          key: "backstage.io/managed-by-location",
          value: "url:https://github.com/backstage/backstage/tree/master/packages/catalog-model/examples/components/www-artist-component.yaml"
        }, {
          key: "backstage.io/managed-by-origin-location",
          value: "url:https://github.com/backstage/backstage/blob/master/packages/catalog-model/examples/all-components.yaml"
        }, {
          key: "backstage.io/view-url",
          value: "https://github.com/backstage/backstage/tree/master/packages/catalog-model/examples/components/www-artist-component.yaml"
        }, {
          key: "backstage.io/edit-url",
          value: "https://github.com/backstage/backstage/edit/master/packages/catalog-model/examples/components/www-artist-component.yaml"
        }, {
          key: "backstage.io/source-location",
          value: "url:https://github.com/backstage/backstage/tree/master/packages/catalog-model/examples/components/"
        }]
      },
    });
  });

  it.eventually('can look up a known component', function* () {
    expect(
      yield graphql.query({
        entity: {
          __args: { kind: 'Component', name: 'www-artist' },
          name: true,
          __on: {
            __typeName: 'Website',
            lifecycle: true,
          }
        },
      }),
    ).toMatchObject({ entity: { name: 'www-artist', lifecycle: 'PRODUCTION' } });
  });

  it.eventually("can look up a component's owner", function* () {
    expect(
      yield graphql.query({
        entity: {
          __args: { kind: 'Component', name: 'www-artist' },
          name: true,
          __on: {
            __typeName: 'Website',
            lifecycle: true,
            ownedBy: {
              __on: {
                __typeName: 'Team',
                name: true,
                email: true,
                displayName: true,
                picture: true
              }
            }
          }
        },
      }),
    ).toMatchObject({
      entity: {
        name: 'www-artist',
        lifecycle: 'PRODUCTION',
        ownedBy: {
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
      yield graphql.query({
        entity: {
          __args: { kind: 'Component', name: 'www-artist' },
          __on: {
            __typeName: 'Website',
            lifecycle: true,
            partOf: {
              __on: {
                __typeName: 'System',
                name: true,
                description: true
              }
            }
          }
        },
      }),
    ).toMatchObject({
      entity: {
        lifecycle: 'PRODUCTION',
        partOf: { name: 'artist-engagement-portal', description: 'Everything related to artists' }
      }
    });
  });

  it.eventually("looks up component's parts", function* () {
    expect(
      yield graphql.query({
        entity: {
          __args: { kind: 'Component', name: 'wayback-archive' },
          name: true,
          __on: {
            __typeName: 'Service',
            hasPart: {
              __on: {
                __typeName: 'Service',
                name: true
              }
            }
          }
        },
      }),
    ).toMatchObject({
      entity: {
        name: 'wayback-archive',
        hasPart: [{ name: 'wayback-archive-ingestion' }, { name: 'wayback-archive-storage' }]
      }
    });
  });

  it.eventually("looks up component's apis", function* () {
    expect(
      yield graphql.query({
        entity: {
          __args: { kind: 'Component', name: 'wayback-search' },
          name: true,
          __on: {
            __typeName: 'Service',
            providesApi: {
              __on: {
                __typeName: 'Openapi',
                name: true
              }
            },
            consumesApi: {
              __on: {
                __typeName: 'Openapi',
                name: true
              }
            }
          }
        },
      }),
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
      yield graphql.query({
        entity: {
          __args: { kind: 'Component', name: 'artist-lookup' },
          name: true,
          __on: {
            __typeName: 'Service',
            dependsOn: {
              __on: {
                __typeName: 'Database',
                name: true
              }
            }
          }
        },
      }),
    ).toMatchObject({
      entity: {
        name: 'artist-lookup',
        dependsOn: [{ name: 'artists-db' }]
      }
    });
  });

  it.eventually("can look up components hierarchy", function* () {
    expect(
      yield graphql.query({
        entity: {
          __args: { kind: 'Component', name: 'wayback-archive-storage' },
          description: true,
          __on: {
            __typeName: 'Service',
            partOf: {
              __on: {
                __typeName: 'Service',
                name: true,
                description: true
              }
            }
          }
        },
      }),
    ).toMatchObject({
      entity: {
        description: 'Storage subsystem of the Wayback Archive',
        partOf: { name: 'wayback-archive', description: 'Archive of the wayback machine' }
      }
    });
  });

  it.eventually('can look up a known user', function* () {
    expect(
      yield graphql.query({
        entity: {
          __args: { kind: 'User', name: 'janelle.dawe' },
          __on: {
            __typeName: 'User',
            displayName: true,
            email: true,
            picture: true
          }
        },
      }),
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
      yield graphql.query({
        entity: {
          __args: { kind: 'User', name: 'janelle.dawe' },
          name: true,
          __on: {
            __typeName: 'User',
            memberOf: {
              __on: {
                __typeName: 'Team',
                name: true,
                displayName: true,
                email: true,
              }
            }
          }
        },
      }),
    ).toMatchObject({
      entity: {
        name: 'janelle.dawe',
        memberOf: [{ name: 'team-a', displayName: null, email: 'team-a@example.com' }]
      }
    });
  });

  it.eventually('can look up a known group', function* () {
    expect(
      yield graphql.query({
        entity: {
          __args: { kind: 'Group', name: 'team-a' },
          __on: {
            __typeName: 'Team',
            displayName: true,
            email: true,
            picture: true
          }
        },
      }),
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
      yield graphql.query({
        entity: {
          __args: { kind: 'Group', name: 'infrastructure' },
          name: true,
          __on: {
            __typeName: 'Department',
            parentOf: {
              __on: {
                __typeName: 'SubDepartment',
                name: true,
                displayName: true,
              }
            }
          }
        },
      }),
    ).toMatchObject({
      entity: {
        name: 'infrastructure',
        parentOf: [{
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
      yield graphql.query({
        entity: {
          __args: { kind: 'Group', name: 'team-a' },
          name: true,
          __on: {
            __typeName: 'Team',
            hasMember: {
              __on: {
                __typeName: 'User',
                name: true,
                email: true,
              }
            }
          }
        },
      }),
    ).toMatchObject({
      entity: {
        name: 'team-a',
        hasMember: [{
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
      yield graphql.query({
        entity: {
          __args: { kind: 'Group', name: 'team-a' },
          name: true,
          __on: {
            __typeName: 'Team',
            ownerOf: {
              __on: [
                { __typeName: 'Service', name: true },
                { __typeName: 'Website', name: true },
                { __typeName: 'Database', name: true },
                { __typeName: 'Openapi', name: true },
                { __typeName: 'System', name: true }
              ]
            }
          }
        },
      }),
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
      yield graphql.query({
        entity: {
          __args: { kind: 'Group', name: 'team-a' },
          __on: {
            __typeName: 'Team',
            childOf: {
              displayName: true,
              email: true,
              picture: true,
              childOf: {
                displayName: true,
                email: true,
                picture: true,
                description: true,
                childOf: {
                  displayName: true,
                  email: true,
                  picture: true,
                  childOf: {
                    displayName: true,
                  }
                }
              }
            }
          }
        },
      }),
    ).toMatchObject({
      entity: {
        childOf: {
          displayName: 'Backstage',
          email: 'backstage@example.com',
          picture: 'https://avatars.dicebear.com/api/identicon/backstage@example.com.svg?background=%23fff&margin=25',
          childOf: {
            description: 'The infra department',
            displayName: null,
            email: null,
            picture: null,
            childOf: {
              displayName: 'ACME Corp',
              email: 'info@example.com',
              picture: 'https://avatars.dicebear.com/api/identicon/info@example.com.svg?background=%23fff&margin=25',
              childOf: null
            }
          }
        }
      }
    });
  });

  it.eventually('can look up a known system', function* () {
    expect(
      yield graphql.query({
        entity: {
          __args: { kind: 'System', name: 'artist-engagement-portal' },
          description: true,
          __on: {
            __typeName: 'System',
            ownedBy: {
              __on: {
                __typeName: 'Team',
                name: true
              }
            }
          },
        },
      }),
    ).toMatchObject({ entity: { description: 'Everything related to artists', ownedBy: { name: 'team-a' } } });
  });

  it.eventually('looks up system parts', function* () {
    expect(
      yield graphql.query({
        entity: {
          __args: { kind: 'System', name: 'podcast' },
          name: true,
          __on: {
            __typeName: 'System',
            hasPart: {
              __on: [{
                __typeName: 'Service',
                name: true
              }, {
                __typeName: 'Website',
                name: true
              }]
            }
          },
        },
      }),
    ).toMatchObject({ entity: { name: 'podcast', hasPart: [{ name: 'podcast-api' }, { name: 'queue-proxy' }] } });
  });

  it.eventually('can look up a known resource', function* () {
    expect(
      yield graphql.query({
        entity: {
          __args: { kind: 'Resource', name: 'artists-db' },
          description: true,
          __on: {
            __typeName: 'Database',
            ownedBy: {
              __on: {
                __typeName: 'Team',
                name: true
              }
            },
            dependencyOf: {
              __on: {
                __typeName: 'Service',
                name: true
              }
            },
            partOf: {
              __on: {
                __typeName: 'System',
                name: true
              }
            }
          },
        },
      }),
    ).toMatchObject({
      entity: {
        description: 'Stores artist details',
        ownedBy: { name: 'team-a' },
        dependencyOf: [{ name: 'artist-lookup' }],
        partOf: [{ name: 'artist-engagement-portal' }]
      }
    });
  });

  it.eventually('can look up a known API', function* () {
    expect(
      yield graphql.query({
        entity: {
          __args: { kind: 'API', name: 'hello-world' },
          description: true,
          __on: {
            __typeName: 'Grpc',
            lifecycle: true,
            apiProvidedBy: {
              __on: {
                __typeName: 'Service',
                name: true,
                description: true
              }
            }
          },
        },
      }),
    ).toMatchObject({
      entity: {
        description: 'Hello World example for gRPC',
        lifecycle: 'DEPRECATED',
        apiProvidedBy: [{ name: 'petstore', description: 'The Petstore is an example API used to show features of the OpenAPI spec.' }]
      }
    });
  });

  it.eventually('can look up a known location', function* () {
    expect(
      yield graphql.query({
        entity: {
          __args: { kind: 'Location', name: 'example-groups' },
          description: true,
          __on: {
            __typeName: 'Location',
            targets: true,
            target: true,
            type: true
          }
        },
      }),
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
      yield graphql.query({
        entity: {
          __args: { kind: 'Template', name: 'react-ssr-template' },
          description: true,
          __on: {
            __typeName: 'Website',
            output: true
          }
        },
      }),
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
