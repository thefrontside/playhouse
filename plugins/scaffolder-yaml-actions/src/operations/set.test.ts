import { set } from './set';

describe('set', () => {
  it('allows to set number', () => {
    expect(set({
      content: `hello: world`,
      path: 'hello',
      value: 10
    })).toBe("hello: 10\n")
  });
  it('allows to set null value', () => {
    expect(set({
      content: `hello: world`,
      path: 'hello',
      value: null
    })).toBe("hello: null\n")
  });
  it('allows to set string value', () => {
    expect(set({
      content: `hello: world`,
      path: 'hello',
      value: 'world!!!'
    })).toBe("hello: world!!!\n")
  });
  it('allows to set value to resource entity', () => {
    expect(set({
      content: `metadata:
  name: entity-a
kind: component
---
metadata:
      name: entity-b
kind: resource
`,
      path: 'hello',
      value: 'world!!!',
      entityRef: 'resource:default/entity-b'
    })).toBe(`metadata:
  name: entity-a
kind: component
---
metadata:
  name: entity-b
kind: resource
hello: world!!!
`)
  });
});

