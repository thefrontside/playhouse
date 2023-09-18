import { append } from "./append";

describe('append', () => {
  it('adds to the array', () => {
    expect(append({
      content: `root:
  - a`,
      path: 'root',
      value: 'b'
    })).toEqual(`root:
  - a
  - b
`)
  });
  it("creates collection when it doesn't exist", () => {
    expect(append({
      content: `metadata:
        foo:
        `,
      path: 'metadata.tags',
      value: 'production'
    })).toEqual(`metadata:
  foo:
  tags:
    - production
`)
  });
  it('adds to the resource entity', () => {
    expect(append({
      content: `metadata:
        name: entity-a
kind: component
---
metadata:
        name: entity-b
kind: resource
        `,
      path: 'metadata.tags',
      value: 'production',
      entityRef: 'resource:default/entity-b'
    })).toEqual(`metadata:
  name: entity-a
kind: component
---
metadata:
  name: entity-b
  tags:
    - production
kind: resource
`)
  });
});
