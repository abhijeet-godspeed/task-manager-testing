
import { logger } from '@godspeedsystems/core';
import appPromise from './index'; // loads dotenv + initializes Godspeed
import { setApp, shutdownApp } from './state';

before(async function () {
  this.timeout(10000);
  try {
    const gsApp = await appPromise;
    setApp(gsApp);
  } catch (err) {
    logger.error('App failed to start:', err);
    throw err;
  }
});

after(async function () {
  await shutdownApp(); // if needed, gracefully shutdown datasources, etc.
  setTimeout(() => process.exit(0), 100); // flush logs
});
