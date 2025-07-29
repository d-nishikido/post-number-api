import dotenv from 'dotenv';
import { createApp } from './app';
import { config } from './config/config';
import { logger } from './utils/logger';
import { database } from './utils/database';

// Load environment variables
dotenv.config();

const startServer = async () => {
  try {
    // Initialize database connection
    await database.initialize();

    const app = await createApp();

    const server = app.listen(config.port, () => {
      logger.info(`🚀 Server is running on port ${config.port}`);
      logger.info(`🌍 Environment: ${config.nodeEnv}`);
      logger.info(`📊 Health check available at: http://localhost:${config.port}/health`);
      logger.info(`💾 Database connection ready`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`📡 Received ${signal}. Starting graceful shutdown...`);

      // Close HTTP server first
      server.close(async (err) => {
        if (err) {
          logger.error('❌ Error during server shutdown:', err);
        } else {
          logger.info('✅ Server closed successfully');
        }

        // Close database connections
        try {
          await database.close();
        } catch (dbError) {
          logger.error('❌ Error closing database:', dbError);
        }

        process.exit(err ? 1 : 0);
      });

      // Force exit after timeout
      setTimeout(() => {
        logger.error('❌ Graceful shutdown timeout, forcing exit');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('❌ Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
