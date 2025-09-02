import { jest } from '@jest/globals';

// Mock fs module
jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs') as any;
  return {
    ...actualFs,
    existsSync: jest.fn(),
    statSync: jest.fn(),
    readFileSync: jest.fn(),
    writeFileSync: jest.fn(),
    mkdirSync: jest.fn(),
    readdir: jest.fn(),
    stat: jest.fn(),
  };
});

// Mock path module
jest.mock('path', () => {
  const actualPath = jest.requireActual('path') as any;
  return {
    ...actualPath,
    join: jest.fn((...args: string[]) => args.join('/')),
    dirname: jest.fn((filePath: string) => {
      const parts = filePath.split('/');
      return parts.slice(0, -1).join('/');
    }),
    extname: jest.fn((filePath: string) => {
      const match = filePath.match(/\.([^.]+)$/);
      return match ? `.${match[1]}` : '';
    }),
    isAbsolute: jest.fn((path: string) => path.startsWith('/')),
  };
});