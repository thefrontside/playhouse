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
});