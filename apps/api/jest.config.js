/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  moduleNameMapper: {
    '^@repo/shared$': '<rootDir>/../../packages/shared/src/index.ts',
    '^@repo/prisma$': '<rootDir>/../../packages/prisma/src/client.ts',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
  testRegex: '\\.(spec|test)\\.ts$',
  collectCoverageFrom: ['src/**/*.ts', '!src/main.ts'],
};
