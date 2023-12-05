// jest.config.js
module.exports = {
    testEnvironment: 'node', // or 'jsdom' for browser-like environment
    preset: 'ts-jest',
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    testPathIgnorePatterns: [
      "/node_modules/",
      "/src/__tests__/mock.ts"
    ],
    globals: {
      "transform": {
        "^.+\\.ts?$": ["ts-jest", { tsconfig: 'tsconfig.json' }]
      }
    },
  };
  