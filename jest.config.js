module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js', '**/__tests__/**/*.test.js'],
  testTimeout: 30000,
  verbose: true,
  collectCoverageFrom: [
    'server/**/*.js',
    '!server/**/node_modules/**',
  ],
  setupFiles: ['<rootDir>/tests/setup.js'],
};
