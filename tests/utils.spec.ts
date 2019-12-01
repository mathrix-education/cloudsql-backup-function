import { DatabaseBackupEvent } from '../src/interfaces/database-backup-event';
import { PubSubEvent } from '../src/interfaces/pubsub-event';
import { decodePubSubEvent, encodePubSubEvent, getBucket, getDate, getUri } from '../src/utils';

// Global Jest mocks
jest.mock('moment', () => () => ({ format: (): string => 'mockdate' }));

describe('getBucket', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('should provide bucket from environment variable', () => {
    const oldBucket = process.env.BUCKET;
    const bucket = 'bucket_' + (Math.random() * 1000000).toFixed(0);
    process.env.BUCKET = bucket;

    expect(getBucket()).toBe(bucket);

    if (!oldBucket) {
      delete process.env.BUCKET;
    } else {
      process.env.BUCKET = oldBucket;
    }
  });

  it('should throw exception if BUCKET environment variable is not set', () => {
    expect(() => getBucket()).toThrow(Error);
  });
});

describe('getDate', () => {
  it('should call moment', () => {
    expect(getDate()).toBe('mockdate');
  });
});


describe('getUri', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('should provide a valid database backup uri', () => {
    const oldBucket = process.env.BUCKET;
    const bucket = 'bucket_' + (Math.random() * 1000000).toFixed(0);
    process.env.BUCKET = bucket;

    expect(getUri('test_database'))
      .toBe(`gs://${bucket}/databases/test_database/test_database-mockdate.sql.gz`);

    if (!oldBucket) {
      delete process.env.BUCKET;
    } else {
      process.env.BUCKET = oldBucket;
    }
  });
});


describe('decodePubSubEvent', () => {
  it('should properly decode PubSub event payload', () => {
    const payload: PubSubEvent = {
      data: 'eyJkYXRhYmFzZSI6InRlc3RfZGF0YWJhc2UifQ==', // {"database":"test_database"}
    };

    const decoded = decodePubSubEvent(payload);
    expect(decoded.database).toBe('test_database');
  });

  it('should throw an exception on invalid JSON payload', () => {
    const payload: PubSubEvent = {
      data: 'eFzfZGF0YXRhYWJknRlc3RUiYmhc2ZSIyJ6IfQ==', // Invalid JSON payload
    };

    expect(() => decodePubSubEvent(payload)).toThrow(SyntaxError);
  });
});


describe('encodePubSubEvent', () => {
  it('should properly encode PubSub event payload', () => {
    const data: DatabaseBackupEvent = { database: 'test_database' };
    const base64Payload = encodePubSubEvent(data);

    expect(base64Payload.data).toBeTruthy();
    expect(base64Payload.data.endsWith('=')).toBeTruthy();
  });
});
