jest.mock('llama.rn', () => ({
  initLlama: jest.fn(),
  releaseAllLlama: jest.fn(),
}));

jest.mock('react-native-blob-util', () => ({
  fs: { dirs: { DocumentDir: '/tmp' }, exists: jest.fn(), stat: jest.fn(), unlink: jest.fn() },
  fetch: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
