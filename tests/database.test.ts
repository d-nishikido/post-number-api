import { Pool } from 'pg';

jest.mock('pg');
jest.mock('../src/utils/logger');

const mockPool = {
  connect: jest.fn(),
  query: jest.fn(),
  end: jest.fn(),
  totalCount: 5,
  idleCount: 3, 
  waitingCount: 0,
  on: jest.fn(),
};

const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

// Import database after mocking
const { Database } = require('../src/utils/database');

describe('Database', () => {
  let database: any;

  beforeEach(() => {
    jest.clearAllMocks();
    (Pool as jest.MockedClass<typeof Pool>).mockImplementation(() => mockPool as any);
    database = new Database();
  });

  describe('initialize', () => {
    it('should initialize database connection successfully', async () => {
      mockPool.connect.mockResolvedValueOnce(mockClient);
      mockClient.query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });

      await database.initialize();

      expect(mockPool.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith('SELECT 1');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should throw error when connection test fails', async () => {
      const error = new Error('Connection failed');
      mockPool.connect.mockRejectedValueOnce(error);

      await expect(database.initialize()).rejects.toThrow('Database initialization failed: Connection failed');
    });

    it('should not initialize twice', async () => {
      mockPool.connect.mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValue({ rows: [{ '?column?': 1 }] });

      await database.initialize();
      await database.initialize();

      expect(mockPool.connect).toHaveBeenCalledTimes(1);
    });
  });

  describe('testConnection', () => {
    it('should test connection successfully', async () => {
      mockPool.connect.mockResolvedValueOnce(mockClient);
      mockClient.query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });

      await database.testConnection();

      expect(mockPool.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith('SELECT 1');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should release client even if query fails', async () => {
      const error = new Error('Query failed');
      mockPool.connect.mockResolvedValueOnce(mockClient);
      mockClient.query.mockRejectedValueOnce(error);

      await expect(database.testConnection()).rejects.toThrow('Query failed');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status when connection works', async () => {
      mockPool.connect.mockResolvedValueOnce(mockClient);
      mockClient.query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });

      const health = await database.healthCheck();

      expect(health.status).toBe('healthy');
      expect(health).toHaveProperty('responseTime');
      expect(health.totalConnections).toBe(5);
      expect(health.idleConnections).toBe(3);
      expect(health.waitingConnections).toBe(0);
    });

    it('should return unhealthy status when connection fails', async () => {
      const error = new Error('Connection timeout');
      mockPool.connect.mockRejectedValueOnce(error);

      const health = await database.healthCheck();

      expect(health.status).toBe('unhealthy');
      expect(health.message).toBe('Connection timeout');
      expect(health).toHaveProperty('responseTime');
    });

    it('should release client even if health check fails', async () => {
      const error = new Error('Health check failed');
      mockPool.connect.mockResolvedValueOnce(mockClient);
      mockClient.query.mockRejectedValueOnce(error);

      const health = await database.healthCheck();

      expect(health.status).toBe('unhealthy');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('query', () => {
    it('should execute query successfully', async () => {
      const mockResult = { rows: [{ id: 1, name: 'test' }] };
      mockPool.query.mockResolvedValueOnce(mockResult);

      const result = await database.query('SELECT * FROM test', []);

      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM test', []);
      expect(result).toEqual(mockResult);
    });

    it('should throw error when query fails', async () => {
      const error = new Error('Query failed');
      mockPool.query.mockRejectedValueOnce(error);

      await expect(database.query('SELECT * FROM test')).rejects.toThrow('Query failed');
    });
  });

  describe('getClient', () => {
    it('should return connected client', async () => {
      mockPool.connect.mockResolvedValueOnce(mockClient);

      const client = await database.getClient();

      expect(mockPool.connect).toHaveBeenCalled();
      expect(client).toBe(mockClient);
    });
  });

  describe('close', () => {
    it('should close database connections', async () => {
      mockPool.end.mockResolvedValueOnce(undefined);

      await database.close();

      expect(mockPool.end).toHaveBeenCalled();
    });

    it('should throw error when close fails', async () => {
      const error = new Error('Close failed');
      mockPool.end.mockRejectedValueOnce(error);

      await expect(database.close()).rejects.toThrow('Close failed');
    });
  });

  describe('isReady', () => {
    it('should return false initially', () => {
      expect(database.isReady()).toBe(false);
    });

    it('should return true after initialization', async () => {
      mockPool.connect.mockResolvedValueOnce(mockClient);
      mockClient.query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });

      await database.initialize();

      expect(database.isReady()).toBe(true);
    });
  });
});