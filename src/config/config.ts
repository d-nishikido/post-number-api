import { config as dotenvConfig } from 'dotenv';

// Load environment variables
dotenvConfig();

export const config = {
  // Application
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  logLevel: process.env.LOG_LEVEL || 'info',

  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'post_number_api',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.DB_SSL === 'true',
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    },
  },

  // API
  api: {
    version: process.env.API_VERSION || 'v1',
    rateLimit: parseInt(process.env.API_RATE_LIMIT || '100', 10),
    rateLimitWindow: parseInt(process.env.API_RATE_WINDOW || '60000', 10),
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },

  // Security
  helmet: {
    enabled: process.env.HELMET_ENABLED !== 'false',
  },
  trustProxy: process.env.TRUST_PROXY === 'true',

  // Monitoring
  healthCheck: {
    enabled: process.env.HEALTH_CHECK_ENABLED !== 'false',
  },
  metrics: {
    enabled: process.env.METRICS_ENABLED !== 'false',
  },

  // Development
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTesting: process.env.NODE_ENV === 'test',

  // Request timeout
  requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '30000', 10),
};
