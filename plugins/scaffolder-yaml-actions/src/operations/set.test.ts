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
});

