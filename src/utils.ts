import * as moment from 'moment';
import { DatabaseBackupEvent } from './interfaces/database-backup-event';

export function getBucket(): string {
  if (!process.env.BUCKET) {
    throw new Error('BUCKET environment variable is not set.');
  }

  return process.env.BUCKET;
}

export function getDate(): string {
  return moment().format('YYYY-MM-DD_HH-mm-ss');
}

export function getUri(database: string): string {
  return `gs://${getBucket()}/databases/${database}/${database}-${getDate()}.sql.gz`;
}

export function decodePubSubEvent(pubSubEvent: { data: string }): DatabaseBackupEvent {
  const dataJson = Buffer.from(pubSubEvent.data, 'base64').toString();
  return JSON.parse(dataJson);
}

export function encodePubSubEvent(data: DatabaseBackupEvent): string {
  const dataJson = JSON.stringify(data);
  return Buffer.from(dataJson).toString('base64');
}
