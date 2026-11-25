import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import './models/index.js';

let server;

const startServer = async () => {
  try {
    await connectDB();
    server = http.createServer(app);

    server.listen(env.PORT, () => {
      console.info(
        `[Rifq API] Server running on http://localhost:${env.PORT} (${env.NODE_ENV}) | Docs: http://localhost:${env.PORT}/api/docs`
      );
    });
  } catch (err) {
    console.error('[Rifq API] Failed to start server:', err);
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  console.info(`[Rifq API] Received ${signal}. Starting graceful shutdown...`);
  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    }
    await disconnectDB();
    console.info('[Rifq API] Shutdown complete.');
    process.exit(0);
  } catch (err) {
    console.error('[Rifq API] Error during graceful shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  console.error('[Rifq API] Unhandled Rejection:', reason);
  shutdown('unhandledRejection');
});
process.on('uncaughtException', (err) => {
  console.error('[Rifq API] Uncaught Exception:', err);
  shutdown('uncaughtException');
});

startServer();
