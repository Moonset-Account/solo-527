/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/generated/prisma$': '<rootDir>/src/__mocks__/prismaMock.ts',
    '^@/generated/prisma/(.*)$': '<rootDir>/src/__mocks__/prismaMock.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/lib/services/**/*.ts',
  ],
  transformIgnorePatterns: [
    'node_modules/',
  ],
};
