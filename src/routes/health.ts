import { Router, Request, Response } from 'express';
import { config } from '../config/config';
import { database } from '../utils/database';

export const healthRoute = Router();

healthRoute.get('/', async (_req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const dbHealth = await database.healthCheck();
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(3);

    const overallStatus = dbHealth.status === 'healthy' ? 'healthy' : 'degraded';
    const httpStatus = dbHealth.status === 'healthy' ? 200 : 503;

    const healthCheck = {
      status: dbHealth.status === 'healthy' ? 'success' : 'error',
      data: {
        service: 'Post Number API',
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.nodeEnv,
        version: config.api.version,
        memory: {
          used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
          total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
        },
        database: {
          status: dbHealth.status,
          message: dbHealth.message,
          responseTime: dbHealth.responseTime,
          connections: {
            total: dbHealth.totalConnections,
            idle: dbHealth.idleConnections,
            waiting: dbHealth.waitingConnections,
          },
        },
      },
      meta: {
        timestamp: new Date().toISOString(),
        processing_time: `${processingTime}s`,
      },
    };

    res.status(httpStatus).json(healthCheck);
  } catch (error) {
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(3);

    const healthCheck = {
      status: 'error',
      data: {
        service: 'Post Number API',
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.nodeEnv,
        version: config.api.version,
        memory: {
          used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
          total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
        },
        database: {
          status: 'unhealthy',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        error: 'Health check failed',
      },
      meta: {
        timestamp: new Date().toISOString(),
        processing_time: `${processingTime}s`,
      },
    };

    res.status(503).json(healthCheck);
  }
});
