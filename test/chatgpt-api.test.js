// Unit tests for ChatGPTAPI class
const fs = require('fs');
const path = require('path');

// Mock fetch globally
global.fetch = jest.fn();

// Mock AbortController
global.AbortController = jest.fn(() => ({
  signal: {},
  abort: jest.fn()
}));

// Mock setTimeout/clearTimeout
global.setTimeout = jest.fn((cb) => cb());
global.clearTimeout = jest.fn();

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn()
};

// Mock the Joplin API
const mockJoplin = {
  settings: {
    value: jest.fn()
  }
};
global.joplin = mockJoplin;

// Load ChatGPTAPI class from standalone file
const ChatGPTAPI = require('./ChatGPTAPI-standalone.js');

describe('ChatGPTAPI Class', () => {
  let api;
  
  beforeEach(() => {
    api = new ChatGPTAPI();
    jest.clearAllMocks();
    
    // Set up default mock settings
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

  describe('Constructor', () => {
    test('should initialize with default settings', () => {
      expect(api).toBeDefined();
      expect(api.settings).toBeDefined();
      expect(api.settings.openaiModel).toBe('gpt-4.1');
      expect(api.settings.maxTokens).toBe(1000);
      expect(api.conversationHistory).toEqual([]);
    });
  });

  describe('loadSettings', () => {
    test('should load all settings from Joplin', async () => {
      await api.loadSettings();

      expect(mockJoplin.settings.value).toHaveBeenCalledWith('openaiApiKey');
      expect(mockJoplin.settings.value).toHaveBeenCalledWith('openaiModel');
      expect(mockJoplin.settings.value).toHaveBeenCalledWith('maxTokens');
      expect(mockJoplin.settings.value).toHaveBeenCalledWith('systemPrompt');
      expect(mockJoplin.settings.value).toHaveBeenCalledWith('autoSave');
      expect(mockJoplin.settings.value).toHaveBeenCalledWith('reasoningEffort');
      expect(mockJoplin.settings.value).toHaveBeenCalledWith('verbosity');

      expect(api.settings.openaiApiKey).toBe('sk-test-key-1234567890abcdef');
      expect(api.settings.openaiModel).toBe('gpt-4.1');
      expect(api.settings.maxTokens).toBe(1000);
    });
  });

  describe('validateApiKey', () => {
    test('should validate correct API key format', () => {
      const validKeys = [
        'sk-1234567890abcdef1234567890abcdef',
        'sk-proj-abcdef1234567890abcdef1234567890abcdef',
        'sk-test-1234567890abcdef'
      ];

      validKeys.forEach(key => {
        expect(api.validateApiKey(key)).toBe(true);
      });
    });

  test('should reject invalid API key formats', () => {
    const invalidKeys = [
      '',                              // Empty string -> false
      null,                           // Null -> false  
      undefined,                      // Undefined -> false
      'sk-',                          // Too short -> false
      'sk-short',                     // Still too short -> false
      'sk-' + 'x'.repeat(200),        // Too long -> false
      'sk-invalid@chars!'             // Invalid characters -> false
    ];

    const keysWithWarnings = [
      'invalid-key'                   // No 'sk-' prefix -> true with warning
    ];

    invalidKeys.forEach(key => {
      expect(api.validateApiKey(key)).toBe(false);
    });

    keysWithWarnings.forEach(key => {
      expect(api.validateApiKey(key)).toBe(true); // These pass with warnings
    });
  });

    test('should handle non-string inputs', () => {
      const nonStrings = [123, {}, [], true, false];
      
      nonStrings.forEach(input => {
        expect(api.validateApiKey(input)).toBe(false);
      });
    });
  });

  describe('estimateTokens', () => {
    test('should estimate tokens correctly', () => {
      expect(api.estimateTokens('test')).toBe(1); // 4 chars = 1 token
      expect(api.estimateTokens('hello world')).toBe(3); // 11 chars = 3 tokens
      expect(api.estimateTokens('')).toBe(0);
      expect(api.estimateTokens('a'.repeat(100))).toBe(25); // 100 chars = 25 tokens
    });
  });

  describe('clearConversationHistory', () => {
    test('should clear conversation history', () => {
      // Add some history
      api.conversationHistory = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' }
      ];

      api.clearConversationHistory();

      expect(api.conversationHistory).toEqual([]);
      expect(console.info).toHaveBeenCalledWith('[ChatGPT API] Conversation history cleared');
    });
  });

  describe('getLimitedHistory', () => {
    beforeEach(() => {
      api.conversationHistory = [
        { role: 'user', content: 'First message' }, // ~3 tokens
        { role: 'assistant', content: 'First response' }, // ~3 tokens
        { role: 'user', content: 'Second message' }, // ~3 tokens
        { role: 'assistant', content: 'Second response' } // ~4 tokens
      ];
    });

    test('should return limited history within token limit', () => {
      const limited = api.getLimitedHistory(10);
      
      expect(limited.length).toBeLessThanOrEqual(4);
      expect(limited[0].role).toBe('user'); // Should maintain order
    });

    test('should return empty array for zero token limit', () => {
      const limited = api.getLimitedHistory(0);
      expect(limited).toEqual([]);
    });

    test('should return empty array for empty history', () => {
      api.conversationHistory = [];
      const limited = api.getLimitedHistory(100);
      expect(limited).toEqual([]);
    });
  });

  describe('trimHistoryToTokenLimit', () => {
    beforeEach(() => {
      api.conversationHistory = [
        { role: 'user', content: 'Old message' },
        { role: 'assistant', content: 'Old response' },
        { role: 'user', content: 'Recent message' },
        { role: 'assistant', content: 'Recent response' }
      ];
    });

    test('should trim history to stay within token limit', () => {
      const originalLength = api.conversationHistory.length;
      
      api.trimHistoryToTokenLimit(5); // Very small limit
      
      expect(api.conversationHistory.length).toBeLessThanOrEqual(originalLength);
    });

    test('should not modify history if already within limit', () => {
      const originalHistory = [...api.conversationHistory];
      
      api.trimHistoryToTokenLimit(1000); // Large limit
      
      expect(api.conversationHistory).toEqual(originalHistory);
    });
  });

  describe('sendMessage', () => {
    beforeEach(() => {
      global.fetch.mockClear();
    });

    test('should throw error if API key is not set', async () => {
      mockJoplin.settings.value.mockImplementation((key) => {
        if (key === 'openaiApiKey') return Promise.resolve('');
        return Promise.resolve('default-value');
      });

      await expect(api.sendMessage('Hello')).rejects.toThrow(
        'OpenAI API key is not set. Please configure it in Settings → Plugins → ChatGPT Toolkit.'
      );
    });

    test('should make successful API call with GPT-4.1', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: jest.fn(() => 'application/json')
        },
        text: jest.fn().mockResolvedValue(JSON.stringify({
          choices: [
            { message: { content: 'Hello! How can I help you?' } }
          ],
          usage: { total_tokens: 50 }
        }))
      };

      global.fetch.mockResolvedValue(mockResponse);

      const result = await api.sendMessage('Hello');

      expect(result).toBe('Hello! How can I help you?');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer sk-test-key-1234567890abcdef'
          }
        })
      );
    });

    test('should use responses endpoint for o3 models', async () => {
      mockJoplin.settings.value.mockImplementation((key) => {
        const settings = {
          'openaiApiKey': 'sk-test-key-1234567890abcdef',
          'openaiModel': 'o3-mini',
          'maxTokens': 1000,
          'systemPrompt': 'You are a helpful assistant.',
          'autoSave': true,
          'reasoningEffort': 'low',
          'verbosity': 'low'
        };
        return Promise.resolve(settings[key]);
      });

      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: jest.fn(() => 'application/json')
        },
        text: jest.fn().mockResolvedValue(JSON.stringify({
          choices: [
            { message: { content: 'Response from o3' } }
          ]
        }))
      };

      global.fetch.mockResolvedValue(mockResponse);

      await api.sendMessage('Hello');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/responses',
        expect.any(Object)
      );
    });

    test('should handle API error responses', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: {
          get: jest.fn(() => 'application/json')
        },
        text: jest.fn().mockResolvedValue(JSON.stringify({
          error: { message: 'Invalid API key' }
        }))
      };

      global.fetch.mockResolvedValue(mockResponse);

      await expect(api.sendMessage('Hello')).rejects.toThrow(
        'OpenAI API error: 401 Unauthorized. Invalid API key'
      );
    });

    test('should handle network errors', async () => {
      global.fetch.mockRejectedValue(new Error('Network error: fetch failed'));

      await expect(api.sendMessage('Hello')).rejects.toThrow(
        'Network error: Network error: fetch failed. Please check your internet connection and try again.'
      );
    });

    test('should handle timeout', async () => {
      const abortError = new Error('Request timeout');
      abortError.name = 'AbortError';
      global.fetch.mockRejectedValue(abortError);

      await expect(api.sendMessage('Hello')).rejects.toThrow(
        'Request timeout after 60 seconds'
      );
    });

    test('should handle malformed JSON response', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: jest.fn(() => 'application/json')
        },
        text: jest.fn().mockResolvedValue('invalid json')
      };

      global.fetch.mockResolvedValue(mockResponse);

      await expect(api.sendMessage('Hello')).rejects.toThrow(
        'Invalid JSON response from OpenAI API'
      );
    });

    test('should handle empty choices response', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: jest.fn(() => 'application/json')
        },
        text: jest.fn().mockResolvedValue(JSON.stringify({
          choices: []
        }))
      };

      global.fetch.mockResolvedValue(mockResponse);

      await expect(api.sendMessage('Hello')).rejects.toThrow(
        'No response choices received from ChatGPT'
      );
    });

    test('should store conversation history after successful call', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: jest.fn(() => 'application/json')
        },
        text: jest.fn().mockResolvedValue(JSON.stringify({
          choices: [
            { message: { content: 'Hello! How can I help you?' } }
          ]
        }))
      };

      global.fetch.mockResolvedValue(mockResponse);

      await api.sendMessage('Hello');

      expect(api.conversationHistory).toHaveLength(2);
      expect(api.conversationHistory[0]).toEqual({
        role: 'user',
        content: 'Hello'
      });
      expect(api.conversationHistory[1]).toEqual({
        role: 'assistant',
        content: 'Hello! How can I help you?'
      });
    });
  });

  describe('improveNote', () => {
    test('should call sendMessage with improve prompt', async () => {
      const mockResponse = 'Improved note content';
      api.sendMessage = jest.fn().mockResolvedValue(mockResponse);

      const result = await api.improveNote('Original note content');

      expect(api.sendMessage).toHaveBeenCalledWith(
        expect.stringContaining('Please improve the following note content')
      );
      expect(api.sendMessage).toHaveBeenCalledWith(
        expect.stringContaining('Original note content')
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('summarizeNote', () => {
    test('should call sendMessage with summarize prompt', async () => {
      const mockResponse = 'Summary of the note';
      api.sendMessage = jest.fn().mockResolvedValue(mockResponse);

      const result = await api.summarizeNote('Long note content to summarize');

      expect(api.sendMessage).toHaveBeenCalledWith(
        expect.stringContaining('Please provide a concise summary')
      );
      expect(api.sendMessage).toHaveBeenCalledWith(
        expect.stringContaining('Long note content to summarize')
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('checkGrammar', () => {
    test('should call sendMessage with grammar check prompt', async () => {
      const mockResponse = 'Corrected text';
      api.sendMessage = jest.fn().mockResolvedValue(mockResponse);

      const result = await api.checkGrammar('Text with errors');

      expect(api.sendMessage).toHaveBeenCalledWith(
        expect.stringContaining('Please fix any grammar, spelling, and punctuation errors')
      );
      expect(api.sendMessage).toHaveBeenCalledWith(
        expect.stringContaining('Text with errors')
      );
      expect(result).toBe(mockResponse);
    });
  });
});
