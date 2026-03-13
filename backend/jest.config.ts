import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['src/**/*.(t|j)s', '!src/main.ts'],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@figly/shared(.*)$': '<rootDir>/../packages/shared/src$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFiles: ['./test/setup.ts'],
};

export default config;
