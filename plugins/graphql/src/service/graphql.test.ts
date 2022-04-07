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
      typename: 'Component',
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

  // it.eventually('can look up a known entity by name', function* () {
  //   expect(
  //     yield graphql.query({
  //       entity: {
  //         __args: {
  //           kind: 'Component',
  //           name: 'backstage',
  //           namespace: 'default',
  //         },
  //         name: true,
  //         namespace: true,
  //         description: true,
  //       },
  //     }),
  //   ).toMatchObject({
  //     entity: {
  //       name: 'backstage',
  //       namespace: 'default',
  //       description: 'An example of a Backstage application.',
  //     },
  //   });
  // });

  // it.eventually(
  //   'looks up entities in the default namespace if no namespace provided',
  //   function* () {
  //     expect(
  //       yield graphql.query({
  //         entity: {
  //           __args: { kind: 'Component', name: 'backstage' },
  //           name: true,
  //           namespace: true,
  //           description: true,
  //         },
  //       }),
  //     ).toMatchObject({ entity: { name: 'backstage', namespace: 'default' } });
  //   },
  // );

  // it.skip('can look up a known component', function* () {
  //   expect(
  //     yield graphql.query({
  //       entity: {
  //         __args: { kind: 'Component', name: 'www-artist' },
  //         type: true,
  //         lifecycle: true,
  //       },
  //     }),
  //   ).toMatchObject({ entity: { type: 'website', lifecycle: 'production' } });
  // });
});
