import { Pool, PoolClient } from 'pg';
import { config } from '../config/config';
import { logger } from './logger';

export interface DatabaseHealthStatus {
  status: 'healthy' | 'unhealthy';
  message?: string;
  responseTime?: number;
  totalConnections?: number;
  idleConnections?: number;
  waitingConnections?: number;
}

class Database {
  private pool: Pool;
  private isInitialized: boolean = false;

  constructor() {
    this.pool = new Pool({
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      user: config.database.user,
      password: config.database.password,
      ssl: config.database.ssl,
      min: config.database.pool.min,
      max: config.database.pool.max,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
    });

    this.pool.on('connect', () => {
      logger.debug('Database connection established');
    });

    this.pool.on('error', (err: Error) => {
      logger.error('Database connection error:', err);
    });

    this.pool.on('acquire', () => {
      logger.debug('Database client acquired from pool');
    });

    this.pool.on('release', () => {
      logger.debug('Database client released back to pool');
    });
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.debug('Database already initialized');
      return;
    }

    try {
      logger.info('Initializing database connection...');
      await this.testConnection();
      this.isInitialized = true;
      logger.info('✅ Database initialized successfully');
    } catch (error) {
      logger.error('❌ Database initialization failed:', error);
      throw new Error(
        `Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async testConnection(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('SELECT 1');
      logger.debug('Database connection test successful');
    } catch (error) {
      logger.error('Database connection test failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async query(text: string, params?: any[]): Promise<any> {
    try {
      const result = await this.pool.query(text, params);
      return result;
    } catch (error) {
      logger.error('Database query error:', error);
      throw error;
    }
  }

  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  async healthCheck(): Promise<DatabaseHealthStatus> {
    const startTime = Date.now();

    try {
      const client = await this.pool.connect();
      try {
        await client.query('SELECT 1');
        const responseTime = Date.now() - startTime;

        return {
          status: 'healthy',
          responseTime,
          totalConnections: this.pool.totalCount,
          idleConnections: this.pool.idleCount,
          waitingConnections: this.pool.waitingCount,
        };
      } finally {
        client.release();
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error('Database health check failed:', error);

      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
        totalConnections: this.pool.totalCount,
        idleConnections: this.pool.idleCount,
        waitingConnections: this.pool.waitingCount,
      };
    }
  }

  async close(): Promise<void> {
    try {
      logger.info('Closing database connections...');
      await this.pool.end();
      this.isInitialized = false;
      logger.info('✅ Database connections closed successfully');
    } catch (error) {
      logger.error('❌ Error closing database connections:', error);
      throw error;
    }
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

export const database = new Database();
