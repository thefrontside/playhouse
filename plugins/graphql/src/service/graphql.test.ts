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
            owner: {
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
    ).toMatchObject({ entity: { name: 'www-artist', lifecycle: 'PRODUCTION', owner: { name: 'team-a', email: 'team-a@example.com', displayName: null, picture: 'https://avatars.dicebear.com/api/identicon/team-a@example.com.svg?background=%23fff&margin=25' } } });
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
    ).toMatchObject({ entity: { displayName: 'Janelle Dawe', email: 'janelle-dawe@example.com', picture: 'https://avatars.dicebear.com/api/avataaars/janelle-dawe@example.com.svg?background=%23fff' } });
  });

  it.eventually("can look up a group's parent", function* () {
    expect(
      yield graphql.query({
        entity: {
          __args: { kind: 'Group', name: 'team-a' },
          __on: {
            __typeName: 'Team',
            parent: {
              displayName: true,
              email: true,
              picture: true,
              parent: {
                displayName: true,
                email: true,
                picture: true,
                description: true,
                parent: {
                  displayName: true,
                  email: true,
                  picture: true,
                  parent: {
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
  // TODO subcomponentOf test
  // TODO system test
});
