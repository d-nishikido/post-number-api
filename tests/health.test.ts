import request from 'supertest';
import { createApp } from '../src/app';
import { Application } from 'express';
import * as database from '../src/utils/database';

jest.mock('../src/utils/database');

describe('Health Check', () => {
  let app: Application;
  const mockDatabase = database.database as jest.Mocked<typeof database.database>;

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return healthy status when database is healthy', async () => {
      mockDatabase.healthCheck.mockResolvedValueOnce({
        status: 'healthy',
        responseTime: 10,
        totalConnections: 5,
        idleConnections: 3,
        waitingConnections: 0,
      });

      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('service', 'Post Number API');
      expect(response.body.data).toHaveProperty('status', 'healthy');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('uptime');
      expect(response.body.data).toHaveProperty('environment');
      expect(response.body.data).toHaveProperty('version');
      expect(response.body.data).toHaveProperty('memory');
      expect(response.body.data).toHaveProperty('database');
      expect(response.body.data.database).toHaveProperty('status', 'healthy');
      expect(response.body.data.database).toHaveProperty('responseTime', 10);
      expect(response.body.data.database).toHaveProperty('connections');
    });

    it('should return degraded status when database is unhealthy', async () => {
      mockDatabase.healthCheck.mockResolvedValueOnce({
        status: 'unhealthy',
        message: 'Connection timeout',
        responseTime: 5000,
        totalConnections: 0,
        idleConnections: 0,
        waitingConnections: 0,
      });

      const response = await request(app)
        .get('/health')
        .expect(503);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body.data).toHaveProperty('status', 'degraded');
      expect(response.body.data.database).toHaveProperty('status', 'unhealthy');
      expect(response.body.data.database).toHaveProperty('message', 'Connection timeout');
    });

    it('should return error status when health check fails', async () => {
      mockDatabase.healthCheck.mockRejectedValueOnce(new Error('Health check failed'));

      const response = await request(app)
        .get('/health')
        .expect(503);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body.data).toHaveProperty('status', 'unhealthy');
      expect(response.body.data).toHaveProperty('error', 'Health check failed');
      expect(response.body.data.database).toHaveProperty('status', 'unhealthy');
    });

    it('should have correct response structure', async () => {
      mockDatabase.healthCheck.mockResolvedValueOnce({
        status: 'healthy',
        responseTime: 10,
        totalConnections: 5,
        idleConnections: 3,
        waitingConnections: 0,
      });

      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta).toHaveProperty('timestamp');
      expect(response.body.meta).toHaveProperty('processing_time');
    });
  });

  describe('GET /v1', () => {
    it('should return API info', async () => {
      const response = await request(app)
        .get('/v1')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Post Number API');
      expect(response.body).toHaveProperty('version', 'v1');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /nonexistent', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
      expect(response.body.error).toHaveProperty('message');
    });
  });
});