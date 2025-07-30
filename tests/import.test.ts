import request from 'supertest';
import { createApp } from '../src/app';
import { Application } from 'express';
import * as database from '../src/utils/database';

jest.mock('../src/utils/database');

describe('Import API', () => {
  let app: Application;
  const mockDatabase = database.database as jest.Mocked<typeof database.database>;

  beforeAll(async () => {
    app = await createApp();
  });

  describe('POST /v1/import', () => {
    it('should return 400 when no file is uploaded', async () => {
      const response = await request(app)
        .post('/v1/import')
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'No file uploaded',
        message: 'Please upload a CSV file',
      });
    });

    it('should return 500 when non-CSV file is uploaded (multer error)', async () => {
      const response = await request(app)
        .post('/v1/import')
        .attach('csvFile', Buffer.from('test content'), 'test.txt')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /v1/import/status/:id', () => {
    it('should return 400 for invalid import ID', async () => {
      const response = await request(app)
        .get('/v1/import/status/invalid')
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Invalid import ID',
        message: 'Import ID must be a number',
      });
    });

    it('should return 404 for non-existent import ID', async () => {
      mockDatabase.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/v1/import/status/99999')
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Import not found',
        message: 'Import with ID 99999 not found',
      });
    });
  });

  describe('GET /v1/import/logs', () => {
    it('should return import logs with default pagination', async () => {
      mockDatabase.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/v1/import/logs')
        .expect(200);

      expect(response.body).toHaveProperty('logs');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toMatchObject({
        limit: 50,
        offset: 0,
      });
    });

    it('should return 400 when limit exceeds maximum', async () => {
      const response = await request(app)
        .get('/v1/import/logs?limit=101')
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Invalid limit',
        message: 'Limit cannot exceed 100',
      });
    });

    it('should accept custom limit and offset', async () => {
      mockDatabase.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/v1/import/logs?limit=10&offset=5')
        .expect(200);

      expect(response.body.pagination).toMatchObject({
        limit: 10,
        offset: 5,
      });
    });
  });
});