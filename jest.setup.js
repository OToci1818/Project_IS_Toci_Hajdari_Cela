/**
 * Jest Setup File
 * This file runs before each test file
 */

// Mock Prisma client for all tests
jest.mock('./src/lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    task: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    activityLog: {
      create: jest.fn(),
    },
    notification: {
      create: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback({
      user: { findUnique: jest.fn(), create: jest.fn() },
      project: { findUnique: jest.fn(), create: jest.fn() },
      task: { findUnique: jest.fn(), create: jest.fn() },
    })),
  },
}));

// Global test timeout
jest.setTimeout(10000);

// Console error/warn suppression for cleaner test output (optional)
// Uncomment if you want to suppress console output during tests
// global.console = {
//   ...console,
//   error: jest.fn(),
//   warn: jest.fn(),
// };
