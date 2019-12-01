import * as mod from '../src/index';

const testBed = mod['cloudsql-backup-function'];

describe('index', () => {
  it('should run', async () => {
    expect(await testBed()).toBe(0);
  }, 30000);
});

