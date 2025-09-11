// Error handling and edge case tests
const fs = require('fs');
const path = require('path');

// Mock global objects for error scenarios
global.fetch = jest.fn();
global.AbortController = jest.fn(() => ({
  signal: {},
  abort: jest.fn()
}));
global.setTimeout = jest.fn();
global.clearTimeout = jest.fn();
global.console = {
  ...console,
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn()
};

// Enhanced mock for error testing
const mockJoplin = {
  settings: {
    value: jest.fn()
  },
  workspace: {
    selectedNoteIds: jest.fn()
  },
  data: {
    get: jest.fn(),
    put: jest.fn(),
    post: jest.fn()
  },
  commands: {
    execute: jest.fn()
  },
  views: {
    dialogs: {
      showMessageBox: jest.fn()
    },
    panels: {
      postMessage: jest.fn()
    }
  },
  clipboard: {
    writeText: jest.fn()
  }
};

global.joplin = mockJoplin;

// Load ChatGPTAPI class from standalone file
const ChatGPTAPI = require('./ChatGPTAPI-standalone.js');

describe('Error Handling and Edge Cases', () => {
  let api;

  beforeEach(() => {
    api = new ChatGPTAPI();
    jest.clearAllMocks();

    // Default settings mock
    mockJoplin.settings.value.mockImplementation((key) => {
      const settings = {
        'openaiApiKey': 'sk-test-key-1234567890abcdef',
        'openaiModel': 'gpt-4.1',
        'maxTokens': 1000,
        'systemPrompt': 'You are a helpful assistant.',
        'autoSave': true,
        'reasoningEffort': 'low',
        'verbosity': 'low'
      };
      return Promise.resolve(settings[key]);
    });
  });

  describe('API Key Validation Edge Cases', () => {
    test('should handle null and undefined API keys', () => {
      expect(api.validateApiKey(null)).toBe(false);
      expect(api.validateApiKey(undefined)).toBe(false);
    });

    test('should handle empty and whitespace-only keys', () => {
      expect(api.validateApiKey('')).toBe(false);
      // Note: Whitespace-only keys that don't start with 'sk-' return true with warning
      expect(api.validateApiKey('   ')).toBe(true); // Passes with warning
      expect(api.validateApiKey('\t\n')).toBe(true); // Passes with warning
    });

    test('should handle keys with special characters', () => {
      expect(api.validateApiKey('sk-test@key!')).toBe(false);
      expect(api.validateApiKey('sk-test key')).toBe(false);
      expect(api.validateApiKey('sk-test#key')).toBe(false);
    });

    test('should handle extremely long keys', () => {
      const longKey = 'sk-' + 'a'.repeat(300);
      expect(api.validateApiKey(longKey)).toBe(false);
    });

    test('should handle keys without sk- prefix', () => {
      // Note: Keys without 'sk-' prefix return true with warning (lenient validation)
      expect(api.validateApiKey('test-key-without-prefix')).toBe(true);
      expect(api.validateApiKey('ak-alternative-prefix')).toBe(true);
    });
  });

  describe('Network Error Scenarios', () => {
    test('should handle complete network failure', async () => {
      global.fetch.mockRejectedValue(new Error('fetch failed: Network is unreachable'));

      await expect(api.sendMessage('Hello')).rejects.toThrow(
        'Network error:'
      );
    });

    test('should handle DNS resolution failure', async () => {
      global.fetch.mockRejectedValue(new Error('fetch failed: DNS resolution failed'));

      await expect(api.sendMessage('Hello')).rejects.toThrow(
        'Network error:'
      );
    });

    test('should handle connection timeout', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'AbortError';
      global.fetch.mockRejectedValue(timeoutError);

      await expect(api.sendMessage('Hello')).rejects.toThrow(
        'Request timeout after 60 seconds'
      );
    });

    test('should handle SSL/TLS errors', async () => {
      global.fetch.mockRejectedValue(new Error('fetch failed: SSL certificate error'));

      await expect(api.sendMessage('Hello')).rejects.toThrow(
        'Network error:'
      );
    });
  });

  describe('API Response Error Scenarios', () => {
    test('should handle 429 rate limit errors', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: { get: jest.fn(() => 'application/json') },
        text: jest.fn().mockResolvedValue(JSON.stringify({
          error: { 
            message: 'Rate limit exceeded. Please try again later.',
            type: 'rate_limit_exceeded' 
          }
        }))
      });

      await expect(api.sendMessage('Hello')).rejects.toThrow(
        'OpenAI API error: 429 Too Many Requests. Rate limit exceeded. Please try again later.'
      );
    });

    test('should handle 401 authentication errors', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: { get: jest.fn(() => 'application/json') },
        text: jest.fn().mockResolvedValue(JSON.stringify({
          error: { message: 'Invalid API key provided' }
        }))
      });

      await expect(api.sendMessage('Hello')).rejects.toThrow(
        'OpenAI API error: 401 Unauthorized. Invalid API key provided'
      );
    });

    test('should handle 500 server errors', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: { get: jest.fn(() => 'application/json') },
        text: jest.fn().mockResolvedValue(JSON.stringify({
          error: { message: 'The server had an error processing your request' }
        }))
      });

      await expect(api.sendMessage('Hello')).rejects.toThrow(
        'OpenAI API error: 500 Internal Server Error'
      );
    });

    test('should handle malformed error response', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: { get: jest.fn(() => 'application/json') },
        text: jest.fn().mockResolvedValue('invalid json response')
      });

      await expect(api.sendMessage('Hello')).rejects.toThrow(
        'OpenAI API error: 400 Bad Request. Unknown error'
      );
    });

    test('should handle empty error response', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        headers: { get: jest.fn(() => 'application/json') },
        text: jest.fn().mockResolvedValue('')
      });

      await expect(api.sendMessage('Hello')).rejects.toThrow(
        'OpenAI API error: 503 Service Unavailable. Unknown error'
      );
    });
  });

  describe('Response Parsing Edge Cases', () => {
    test('should handle completely invalid JSON', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: { get: jest.fn(() => 'application/json') },
        text: jest.fn().mockResolvedValue('not json at all')
      });

      await expect(api.sendMessage('Hello')).rejects.toThrow(
        'Invalid JSON response from OpenAI API'
      );
    });

    test('should handle partial JSON response', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: { get: jest.fn(() => 'application/json') },
        text: jest.fn().mockResolvedValue('{"choices": [{"message":')
      });

      await expect(api.sendMessage('Hello')).rejects.toThrow(
        'Invalid JSON response from OpenAI API'
      );
    });

    test('should handle response with no choices array', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: { get: jest.fn(() => 'application/json') },
        text: jest.fn().mockResolvedValue(JSON.stringify({
          model: 'gpt-4.1',
          usage: { total_tokens: 10 }
        }))
      });

      await expect(api.sendMessage('Hello')).rejects.toThrow(
        'No response choices received from ChatGPT'
      );
    });

    test('should handle response with empty choices array', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: { get: jest.fn(() => 'application/json') },
        text: jest.fn().mockResolvedValue(JSON.stringify({
          choices: [],
          usage: { total_tokens: 10 }
        }))
      });

      await expect(api.sendMessage('Hello')).rejects.toThrow(
        'No response choices received from ChatGPT'
      );
    });

    test('should handle choice without message content', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: { get: jest.fn(() => 'application/json') },
        text: jest.fn().mockResolvedValue(JSON.stringify({
          choices: [{ message: {} }]
        }))
      });

      await expect(api.sendMessage('Hello')).rejects.toThrow(
        'No content in ChatGPT response'
      );
    });

    test('should handle choice with null content', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: { get: jest.fn(() => 'application/json') },
        text: jest.fn().mockResolvedValue(JSON.stringify({
          choices: [{ message: { content: null } }]
        }))
      });

      await expect(api.sendMessage('Hello')).rejects.toThrow(
        'No content in ChatGPT response'
      );
    });

    test('should handle choice with empty string content', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: { get: jest.fn(() => 'application/json') },
        text: jest.fn().mockResolvedValue(JSON.stringify({
          choices: [{ message: { content: '' } }]
        }))
      });

      await expect(api.sendMessage('Hello')).rejects.toThrow(
        'No content in ChatGPT response'
      );
    });
  });

  describe('Input Validation Edge Cases', () => {
    test('should handle extremely long messages', async () => {
      const veryLongMessage = 'a'.repeat(100000);
      
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: { get: jest.fn(() => 'application/json') },
        text: jest.fn().mockResolvedValue(JSON.stringify({
          choices: [{ message: { content: 'Response to long message' } }]
        }))
      });

      const result = await api.sendMessage(veryLongMessage);
      expect(result).toBe('Response to long message');
    });

    test('should handle empty message', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: { get: jest.fn(() => 'application/json') },
        text: jest.fn().mockResolvedValue(JSON.stringify({
          choices: [{ message: { content: 'I received an empty message' } }]
        }))
      });

      const result = await api.sendMessage('');
      expect(result).toBe('I received an empty message');
    });

    test('should handle messages with special characters', async () => {
      const specialMessage = '🚀 Hello! @#$%^&*()_+ 中文 العربية 🎉';
      
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: { get: jest.fn(() => 'application/json') },
        text: jest.fn().mockResolvedValue(JSON.stringify({
          choices: [{ message: { content: 'Response with special chars' } }]
        }))
      });

      const result = await api.sendMessage(specialMessage);
      expect(result).toBe('Response with special chars');
    });

    test('should handle null and undefined messages', async () => {
      await expect(api.sendMessage(null)).rejects.toThrow();
      await expect(api.sendMessage(undefined)).rejects.toThrow();
    });
  });

  describe('Settings Loading Edge Cases', () => {
    test('should handle missing API key setting', async () => {
      mockJoplin.settings.value.mockImplementation((key) => {
        if (key === 'openaiApiKey') return Promise.resolve('');
        return Promise.resolve('default-value');
      });

      await expect(api.sendMessage('Hello')).rejects.toThrow(
        'OpenAI API key is not set'
      );
    });

    test('should handle settings loading failure', async () => {
      mockJoplin.settings.value.mockRejectedValue(new Error('Settings not available'));

      await expect(api.sendMessage('Hello')).rejects.toThrow(
        'Settings not available'
      );
    });

    test('should handle null settings values', async () => {
      mockJoplin.settings.value.mockImplementation((key) => {
        if (key === 'openaiApiKey') return Promise.resolve(null);
        return Promise.resolve('default-value');
      });

      await expect(api.sendMessage('Hello')).rejects.toThrow(
        'OpenAI API key is not set'
      );
    });
  });

  describe('Token Estimation Edge Cases', () => {
    test('should handle very large text inputs', () => {
      const hugeText = 'a'.repeat(1000000);
      const tokens = api.estimateTokens(hugeText);
      expect(tokens).toBe(250000); // 1M chars / 4 = 250K tokens
    });

    test('should handle empty strings', () => {
      expect(api.estimateTokens('')).toBe(0);
      // Note: The implementation now gracefully handles null/undefined by returning 0
      expect(api.estimateTokens(null)).toBe(0);
      expect(api.estimateTokens(undefined)).toBe(0);
    });

    test('should handle unicode characters', () => {
      const unicodeText = '🚀🎉💻🔥'; // 4 emoji characters
      const tokens = api.estimateTokens(unicodeText);
      expect(tokens).toBeGreaterThan(0);
    });
  });

  describe('Conversation History Edge Cases', () => {
    test('should handle history with extremely long messages', () => {
      const longMessage = 'a'.repeat(10000);
      api.conversationHistory = [
        { role: 'user', content: longMessage },
        { role: 'assistant', content: longMessage }
      ];

      api.trimHistoryToTokenLimit(100);
      expect(api.conversationHistory.length).toBeLessThanOrEqual(2);
    });

    test('should handle corrupted conversation history', () => {
      api.conversationHistory = [
        null,
        { role: 'user' }, // Missing content
        { content: 'message without role' },
        { role: 'user', content: 'valid message' }
      ];

      expect(() => api.trimHistoryToTokenLimit(1000)).not.toThrow();
    });

    test('should handle negative token limits', () => {
      api.conversationHistory = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi!' }
      ];

      api.trimHistoryToTokenLimit(-100);
      expect(api.conversationHistory).toEqual([]);
    });
  });

  describe('Model-Specific Edge Cases', () => {
    test('should handle unknown model names', async () => {
      mockJoplin.settings.value.mockImplementation((key) => {
        const settings = {
          'openaiApiKey': 'sk-test-key-1234567890abcdef',
          'openaiModel': 'unknown-model-v999',
          'maxTokens': 1000,
          'systemPrompt': 'You are a helpful assistant.',
          'autoSave': true,
          'reasoningEffort': 'low',
          'verbosity': 'low'
        };
        return Promise.resolve(settings[key]);
      });

      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: { get: jest.fn(() => 'application/json') },
        text: jest.fn().mockResolvedValue(JSON.stringify({
          error: { message: 'Model unknown-model-v999 does not exist' }
        }))
      });

      await expect(api.sendMessage('Hello')).rejects.toThrow(
        'Model unknown-model-v999 does not exist'
      );
    });

    test('should handle model-specific parameter conflicts', async () => {
      mockJoplin.settings.value.mockImplementation((key) => {
        const settings = {
          'openaiApiKey': 'sk-test-key-1234567890abcdef',
          'openaiModel': 'o3-mini',
          'maxTokens': 1000,
          'systemPrompt': 'You are a helpful assistant.',
          'autoSave': true,
          'reasoningEffort': 'invalid-effort-level',
          'verbosity': 'invalid-verbosity-level'
        };
        return Promise.resolve(settings[key]);
      });

      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: { get: jest.fn(() => 'application/json') },
        text: jest.fn().mockResolvedValue(JSON.stringify({
          error: { message: 'Invalid reasoning_effort parameter' }
        }))
      });

      await expect(api.sendMessage('Hello')).rejects.toThrow(
        'Invalid reasoning_effort parameter'
      );
    });
  });

  describe('Memory and Performance Edge Cases', () => {
    test('should handle memory exhaustion scenarios', () => {
      // Fill conversation history with many large messages
      for (let i = 0; i < 1000; i++) {
        api.conversationHistory.push({
          role: 'user',
          content: 'Large message '.repeat(1000)
        });
      }

      expect(() => api.trimHistoryToTokenLimit(1000)).not.toThrow();
      expect(api.conversationHistory.length).toBeLessThan(1000);
    });

    test('should handle concurrent message sending', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: { get: jest.fn(() => 'application/json') },
        text: jest.fn().mockResolvedValue(JSON.stringify({
          choices: [{ message: { content: 'Concurrent response' } }]
        }))
      });

      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(api.sendMessage(`Message ${i}`));
      }

      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toBe('Concurrent response');
      });
    });
  });
});
