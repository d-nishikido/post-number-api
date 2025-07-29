import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/config';
import { logger } from './utils/logger';
import { errorHandler } from './middlewares/errorHandler';
import { notFoundHandler } from './middlewares/notFoundHandler';
import { healthRoute } from './routes/health';

export const createApp = async (): Promise<express.Application> => {
  const app = express();

  // Security middleware
  if (config.helmet.enabled) {
    app.use(helmet());
  }

  // CORS middleware
  app.use(
    cors({
      origin: config.cors.origin,
      credentials: config.cors.credentials,
    }),
  );

  // Request logging
  if (config.nodeEnv === 'development') {
    app.use(
      morgan('combined', {
        stream: { write: (message) => logger.info(message.trim()) },
      }),
    );
  } else {
    app.use(
      morgan('combined', {
        stream: { write: (message) => logger.info(message.trim()) },
      }),
    );
  }

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Trust proxy if configured
  if (config.trustProxy) {
    app.set('trust proxy', 1);
  }

  // Health check route
  app.use('/health', healthRoute);

  // API routes
  app.use(`/${config.api.version}`, (_req, res, next) => {
    // API version middleware
    res.setHeader('API-Version', config.api.version);
    next();
  });

  // Placeholder for future API routes
  app.get(`/${config.api.version}`, (_req, res) => {
    res.json({
      message: 'Post Number API',
      version: config.api.version,
      environment: config.nodeEnv,
      timestamp: new Date().toISOString(),
    });
  });

  // 404 handler
  app.use(notFoundHandler);

  // Error handling middleware
  app.use(errorHandler);

  return app;
};
