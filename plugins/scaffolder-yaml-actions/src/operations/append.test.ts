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
});