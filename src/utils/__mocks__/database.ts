export const database = {
  query: jest.fn(),
  getClient: jest.fn(),
  close: jest.fn(),
  initialize: jest.fn(),
  testConnection: jest.fn(),
  healthCheck: jest.fn(),
  isReady: jest.fn(),
};
