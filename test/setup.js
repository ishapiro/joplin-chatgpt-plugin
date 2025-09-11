// Test setup for ChatGPT Toolkit Plugin
require('dotenv').config({ path: '.env.local' });

// Mock global objects that might be used across tests
global.fetch = jest.fn();
global.AbortController = jest.fn(() => ({
  signal: {},
  abort: jest.fn()
}));

// Mock console methods to reduce test noise
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
  debug: jest.fn()
};

// Global test setup
beforeAll(() => {
  console.log('Setting up ChatGPT Toolkit Plugin tests...');
  
  // Set up global mocks that persist across all tests
  jest.setTimeout(10000);
  
  // Mock timers for consistent testing
  jest.useFakeTimers();
});

afterAll(() => {
  console.log('Cleaning up ChatGPT Toolkit Plugin tests...');
  
  // Restore original console
  global.console = originalConsole;
  
  // Cleanup timers
  jest.useRealTimers();
});

beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Reset fetch mock
  if (global.fetch && global.fetch.mockClear) {
    global.fetch.mockClear();
  }
});

// Helper function to create a mock Joplin API
global.createMockJoplin = () => ({
  plugins: {
    register: jest.fn()
  },
  settings: {
    registerSection: jest.fn(),
    registerSettings: jest.fn(),
    value: jest.fn((key) => {
      const defaults = {
        'openaiApiKey': 'sk-test-key-1234567890abcdef',
        'openaiModel': 'gpt-4.1',
        'maxTokens': 1000,
        'systemPrompt': 'You are a helpful assistant.',
        'autoSave': true,
        'reasoningEffort': 'low',
        'verbosity': 'low'
      };
      return Promise.resolve(defaults[key] || 'default-value');
    })
  },
  commands: {
    register: jest.fn(),
    execute: jest.fn()
  },
  views: {
    panels: {
      create: jest.fn().mockResolvedValue('test-panel-id'),
      setHtml: jest.fn(),
      addScript: jest.fn(),
      show: jest.fn(),
      hide: jest.fn(),
      visible: jest.fn(),
      postMessage: jest.fn(),
      onMessage: jest.fn()
    },
    dialogs: {
      showMessageBox: jest.fn(),
      showPrompt: jest.fn()
    }
  },
  data: {
    get: jest.fn(),
    put: jest.fn(),
    post: jest.fn()
  },
  workspace: {
    selectedNoteIds: jest.fn().mockResolvedValue(['test-note-id'])
  },
  clipboard: {
    writeText: jest.fn()
  }
});

// Helper function to create successful API response mock
global.createSuccessfulApiResponse = (content = 'Test response') => ({
  ok: true,
  status: 200,
  statusText: 'OK',
  headers: {
    get: jest.fn(() => 'application/json')
  },
  text: jest.fn().mockResolvedValue(JSON.stringify({
    choices: [{ message: { content } }],
    usage: { total_tokens: 50 }
  }))
});

// Helper function to create error API response mock
global.createErrorApiResponse = (status = 400, message = 'Bad Request') => ({
  ok: false,
  status,
  statusText: message,
  headers: {
    get: jest.fn(() => 'application/json')
  },
  text: jest.fn().mockResolvedValue(JSON.stringify({
    error: { message }
  }))
});

// Suppress specific console outputs during tests
const originalError = console.error;
console.error = (...args) => {
  // Suppress specific known test-related errors
  const message = args[0];
  if (typeof message === 'string' && (
    message.includes('Warning: React.createElement') ||
    message.includes('Warning: validateDOMNesting') ||
    message.includes('act(...) is not supported')
  )) {
    return;
  }
  originalError.apply(console, args);
};
