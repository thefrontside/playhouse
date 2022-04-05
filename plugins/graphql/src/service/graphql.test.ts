import { describe, beforeAll, it } from "@effection/jest";
import { createBackstage, GraphQLAPI } from "../setupTests";

describe('querying the graphql API', () => {
  let graphql: GraphQLAPI;

  beforeAll(function*() {
    graphql = yield createBackstage({ log: false });
  });

  it('can lookup entities', function*() {
    expect(yield graphql.query({
      entities: {
        __args: { kind: 'Component', name: 'backstage', namespace: 'default' },
        name: true,
        namespace: true,
        description: true,
      }
    })).toMatchObject({
      name: 'backstage',
      namespace: 'default',
      description: "An example of a Backstage application.",
    })
  });
  it.skip('looks up entities in the default namespace if no namespace provided', function*() {
    expect(yield graphql.query({
      entities: {
        __args: { kind: 'Component', name: 'backstage' },
        name: true,
        namespace: true,
        description: true,
      }
    })).toMatchObject({ name: 'backstage' });
  });

  it.skip('can look up a known entity by ide', function*() {
    let { id } = graphql.query({
      entities: {
        __args: { kind: 'Component', name: 'backstage' },
        id: true
      }
    });
    expect(yield graphql.query({
      node: {
        __args: { id },
        __on: {
          __typeName: "Entity",
            name: true
        },
      },
    })).toMatchObject({ name: 'backstage '});

  })
});
