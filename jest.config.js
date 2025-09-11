module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'dist/**/*.js',
    'src/webview.js',
    '!dist/**/*.map',
    '!src/**/*.ts',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  moduleNameMapper: {
    '^api$': '<rootDir>/test/mocks/api.js',
  },
  testTimeout: 10000,
  verbose: true,
  collectCoverage: true,
  maxWorkers: 4,
  clearMocks: true,
  restoreMocks: true,
};
