import { describe, beforeAll, it } from "@effection/jest";
import { createBackstage, GraphQLAPI } from "../setupTests";

describe('querying the graphql API', () => {
  let graphql: GraphQLAPI;

  beforeAll(function*() {
    graphql = yield createBackstage({ log: false });
  });

  it.skip('can lookup entities', function*() {
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

  it('can look up a known entity by id', function*() {
    // TODO: make this work
    // let { node: { id } } = yield graphql.query({
    //   entities: {
    //     __args: { kind: 'Component', name: 'backstage' },
    //     id: true
    //   }
    // });
    expect(yield graphql.query({
      node: {
        __args: { id: "hi" },
        id: true
      },
    })).toMatchObject({ node: { id: "Hello World" } });

  })
});
