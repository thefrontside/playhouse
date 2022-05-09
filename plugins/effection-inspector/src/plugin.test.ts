import { inspectorPlugin } from './plugin';

describe('inspector', () => {
  it('should export plugin', () => {
    expect(inspectorPlugin).toBeDefined();
  });
});
