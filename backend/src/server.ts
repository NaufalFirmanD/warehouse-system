import { app } from './app';
import { ENV } from './config/env';
import { checkDatabaseConnection } from './config/db';
import { runMigrations } from './migrations/runMigrations';

async function bootstrap() {
  console.log('🚀 Starting Warehouse Receiving System API...');
  
  // Test DB connection and run migrations if auto-migrate is enabled or during startup
  let dbReady = false;
  let retries = 5;
  while (retries > 0) {
    dbReady = await checkDatabaseConnection();
    if (dbReady) break;
    console.log(`Waiting for database connection... (${retries} retries left)`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    retries--;
  }

  if (dbReady) {
    try {
      await runMigrations();
    } catch (err) {
      console.error('Failed to run migrations on startup:', err);
    }
  } else {
    console.warn('⚠️ Database is not reachable at startup. API will attempt to serve requests once DB recovers.');
  }

  app.listen(ENV.PORT, () => {
    console.log(`📡 Server running on http://localhost:${ENV.PORT}`);
    console.log(`🩺 Health check available at http://localhost:${ENV.PORT}/health`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
