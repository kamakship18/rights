/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.ts$': 'ts-jest' },
  moduleNameMapper: { '^@repo/(.*)$': '<rootDir>/../../packages/$1' },
  collectCoverageFrom: ['src/**/*.ts'],
  coveragePathIgnorePatterns: ['main.ts', 'app.module.ts', 'app.controller.ts'],
};
