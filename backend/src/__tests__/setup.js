// Jest setup file for backend tests

// Mock database connection for tests
jest.mock('../database/connection', () => ({
  query: jest.fn(),
  getClient: jest.fn(),
  connectDatabase: jest.fn().mockResolvedValue(true),
  closeDatabase: jest.fn().mockResolvedValue(true),
  pool: {
    connect: jest.fn(),
    end: jest.fn().mockResolvedValue(true),
    query: jest.fn()
  }
}));

// Mock Redis for tests
jest.mock('../cache/redis', () => ({
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  connect: jest.fn().mockResolvedValue(true),
  disconnect: jest.fn().mockResolvedValue(true),
  quit: jest.fn().mockResolvedValue(true),
  isOpen: false
}));

// Mock logger for tests
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Mock User model for authentication tests
jest.mock('../models/User', () => ({
  findById: jest.fn().mockResolvedValue({
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'admin'
  })
}));

// Mock monitoring for tests
jest.mock('../utils/monitoring', () => ({
  monitor: {
    recordRequest: jest.fn(),
    recordDatabaseQuery: jest.fn(),
    recordCacheHit: jest.fn(),
    getMetrics: jest.fn().mockReturnValue({}),
    getHealthStatus: jest.fn().mockReturnValue({ status: 'healthy' })
  },
  requestMonitoring: jest.fn((req, res, next) => next())
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'test_db';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';

// Global test timeout
jest.setTimeout(10000);

// Cleanup after all tests
afterAll(async () => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Clear all timers
  jest.clearAllTimers();
  
  // Allow time for any pending operations to complete
  await new Promise(resolve => setTimeout(resolve, 100));
});

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Dummy test to prevent "Your test suite must contain at least one test" error
describe('Test Setup', () => {
  test('setup file loads correctly', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});