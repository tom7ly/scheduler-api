// jest.config.js
module.exports = {
    testEnvironment: 'node', // or 'jsdom' for browser-like environment
    preset: 'ts-jest',
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    globals: {
      'ts-jest': {
        tsconfig: 'path/to/your/tsconfig.json',
      },
    },
  };
  