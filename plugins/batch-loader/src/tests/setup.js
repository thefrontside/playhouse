jest.useFakeTimers();

const { TextEncoder, TextDecoder } = require('util');

globalThis.TextEncoder = TextEncoder;
globalThis.TextDecoder = TextDecoder;
