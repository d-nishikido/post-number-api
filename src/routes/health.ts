import { Router, Request, Response } from 'express';
import { config } from '../config/config';

export const healthRoute = Router();

healthRoute.get('/', (_req: Request, res: Response) => {
  const healthCheck = {
    status: 'success',
    data: {
      service: 'Post Number API',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.nodeEnv,
      version: config.api.version,
      memory: {
        used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
        total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
      },
      // TODO: Add database health check
      // database: 'healthy',
    },
    meta: {
      timestamp: new Date().toISOString(),
      processing_time: '0.001s',
    },
  };

  res.status(200).json(healthCheck);
});
