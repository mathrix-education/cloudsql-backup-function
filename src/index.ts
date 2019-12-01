import { RewriteFrames } from '@sentry/integrations';
import * as Sentry from '@sentry/node';
import { google } from 'googleapis';
import { PubSubEvent } from './interfaces/pubsub-event';
import { decodePubSubEvent, getUri } from './utils';

if (process.env.SENTRY_DSN) {
  /**
   * Initialize Sentry
   * Provide root file integration global variable
   * @link https://docs.sentry.io/platforms/node/typescript/
   */
  Sentry.init({
    release: process.env.RELEASE ?? 'unknown',
    dsn: process.env.SENTRY_DSN,
    integrations: [new RewriteFrames({
      root: __dirname || process.cwd(),
    })],
  });
}

/**
 * Core function body
 * @param pubSubEvent
 */
async function main(pubSubEvent: PubSubEvent): Promise<number> {
  // Extract PubSub event data
  const data = decodePubSubEvent(pubSubEvent);
  const database = data.database;

  // Authenticate the Google API
  const auth = new google.auth.GoogleAuth({
    // Scopes reference: https://cloud.google.com/sql/docs/mysql/admin-api/#OAuth2Authorizing
    scopes: [
      'https://www.googleapis.com/auth/sqlservice.admin',
      'https://www.googleapis.com/auth/cloud-platform',
    ],
  });
  const authClient = await auth.getClient();
  const project = await auth.getProjectId();

  const res = await google.sqladmin('v1beta4').instances.export({
    project,
    instance: 'mysql',
    auth: authClient,
    requestBody: {
      exportContext: {
        kind: 'sql#exportContext',
        fileType: 'SQL',
        uri: getUri(database),
        databases: [database],
      },
    },
  });

  if (res.data.status === 'PENDING') {
    console.log(res);
    return 0;
  } else {
    return 1;
  }
}

/**
 * Sentry wrapper.
 * @param pubSubEvent
 */
exports['cloudsql-backup-function'] = async (pubSubEvent: PubSubEvent): Promise<number> => {
  try {
    return await main(pubSubEvent);
  } catch (error) {
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(error);
      await Sentry.flush(2000);
    } else {
      console.error(error);
    }
    throw error; // Rethrow error
  }
};
