import { RewriteFrames } from '@sentry/integrations';
import * as Sentry from '@sentry/node';

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
 * @param data
 */
async function main(data): Promise<number> {
  return 0;
}

/**
 * Sentry wrapper.
 * @param data
 */
exports['your-function'] = async (data): Promise<number> => {
  try {
    return await main(data);
  } catch (error) {
    Sentry.captureException(error);
    await Sentry.flush(2000);
    throw error; // Rethrow error
  }
};
