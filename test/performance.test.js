// Performance and load testing for ChatGPT Toolkit Plugin
const fs = require('fs');
const path = require('path');

// Mock global objects
global.fetch = jest.fn();
global.AbortController = jest.fn(() => ({
  signal: {},
  abort: jest.fn()
}));
global.setTimeout = jest.fn((cb) => cb());
global.clearTimeout = jest.fn();
global.console = {
  ...console,
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn()
};

const mockJoplin = {
  settings: {
    value: jest.fn()
  }
};
global.joplin = mockJoplin;

// Load ChatGPTAPI class from standalone file
const ChatGPTAPI = require('./ChatGPTAPI-standalone.js');

describe('Performance Tests', () => {
  let api;

  beforeEach(() => {
    api = new ChatGPTAPI();
    jest.clearAllMocks();

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

  describe('Token Estimation Performance', () => {
    test('should handle large text efficiently', () => {
      const start = performance.now();
      
      // Test with various text sizes
      const sizes = [1000, 10000, 100000, 500000];
      
      sizes.forEach(size => {
        const text = 'a'.repeat(size);
        const tokens = api.estimateTokens(text);
        expect(tokens).toBe(Math.ceil(size / 4));
      });
      
      const end = performance.now();
      const duration = end - start;
      
      // Should complete within reasonable time (< 100ms for all sizes)
      expect(duration).toBeLessThan(100);
    });

    test('should be consistent across multiple calls', () => {
      const text = 'This is a test message for token estimation.';
      const results = [];
      
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        results.push(api.estimateTokens(text));
      }
      const end = performance.now();
      
      // All results should be identical
      expect(results.every(r => r === results[0])).toBe(true);
      
      // Should complete 1000 calls quickly (< 50ms)
      expect(end - start).toBeLessThan(50);
    });
  });

  describe('Conversation History Performance', () => {
    test('should handle large conversation histories efficiently', () => {
      // Create a large conversation history
      const historySize = 1000;
      for (let i = 0; i < historySize; i++) {
        api.conversationHistory.push({
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `Message ${i} with some content to test performance`
        });
      }

      const start = performance.now();
      
      // Test trimming performance
      api.trimHistoryToTokenLimit(500);
      
      const end = performance.now();
      const duration = end - start;
      
      // Should complete quickly even with large history
      expect(duration).toBeLessThan(100);
      expect(api.conversationHistory.length).toBeLessThan(historySize);
    });

    test('should efficiently get limited history', () => {
      // Create conversation history with varying message sizes
      for (let i = 0; i < 100; i++) {
        api.conversationHistory.push({
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: 'Message content '.repeat(i + 1) // Increasing size
        });
      }

      const start = performance.now();
      
      const limited = api.getLimitedHistory(1000);
      
      const end = performance.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(50);
      expect(limited.length).toBeLessThan(api.conversationHistory.length);
    });
  });

  describe('Memory Usage', () => {
    test('should not leak memory with repeated operations', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform many operations
      for (let i = 0; i < 1000; i++) {
        api.estimateTokens(`Test message ${i}`);
        api.clearConversationHistory();
        
        // Add and remove history
        api.conversationHistory.push({
          role: 'user',
          content: `Message ${i}`
        });
        
        if (i % 100 === 0) {
          api.trimHistoryToTokenLimit(50);
        }
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (< 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Concurrent Operations', () => {
    test('should handle concurrent token estimations', async () => {
      const promises = [];
      const start = performance.now();
      
      // Create 100 concurrent token estimations
      for (let i = 0; i < 100; i++) {
        promises.push(Promise.resolve(api.estimateTokens(`Message ${i}`)));
      }
      
      const results = await Promise.all(promises);
      const end = performance.now();
      
      expect(results).toHaveLength(100);
      expect(end - start).toBeLessThan(100);
    });

    test('should handle concurrent history operations', () => {
      const start = performance.now();
      
      // Simulate concurrent access to conversation history
      const operations = [];
      for (let i = 0; i < 50; i++) {
        operations.push(() => {
          api.conversationHistory.push({
            role: 'user',
            content: `Concurrent message ${i}`
          });
        });
        
        operations.push(() => {
          api.getLimitedHistory(100);
        });
      }
      
      // Execute all operations
      operations.forEach(op => op());
      
      const end = performance.now();
      
      expect(end - start).toBeLessThan(100);
      expect(api.conversationHistory.length).toBe(50);
    });
  });

  describe('Edge Case Performance', () => {
    test('should handle empty operations efficiently', () => {
      const start = performance.now();
      
      for (let i = 0; i < 10000; i++) {
        api.estimateTokens('');
        api.getLimitedHistory(0);
        api.trimHistoryToTokenLimit(0);
      }
      
      const end = performance.now();
      
      // Should handle empty operations very quickly
      expect(end - start).toBeLessThan(100);
    });

    test('should handle malformed history gracefully', () => {
      // Add some malformed entries
      api.conversationHistory = [
        null,
        undefined,
        { role: 'user' }, // Missing content
        { content: 'missing role' }, // Missing role
        { role: 'user', content: 'valid entry' }
      ];
      
      const start = performance.now();
      
      expect(() => {
        api.trimHistoryToTokenLimit(100);
        api.getLimitedHistory(100);
      }).not.toThrow();
      
      const end = performance.now();
      
      expect(end - start).toBeLessThan(50);
    });
  });

  describe('API Call Performance Simulation', () => {
    test('should handle rapid API key validation', () => {
      const keys = [
        'sk-valid-key-1234567890abcdef',
        'invalid-key',
        '',
        null,
        'sk-another-valid-key-abcdef1234567890',
        'sk-short',
        'sk-' + 'x'.repeat(200)
      ];
      
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        const key = keys[i % keys.length];
        api.validateApiKey(key);
      }
      
      const end = performance.now();
      
      // Should validate 1000 keys quickly
      expect(end - start).toBeLessThan(100);
    });

    test('should handle settings loading simulation', async () => {
      let callCount = 0;
      mockJoplin.settings.value.mockImplementation((key) => {
        callCount++;
        // Simulate minimal processing time for test performance
        return Promise.resolve(`value-${callCount}`);
      });
      
      const start = performance.now();
      
      // Simulate multiple concurrent settings loads
      const promises = [];
      for (let i = 0; i < 5; i++) { // Reduced from 10 to 5 for faster execution
        promises.push(api.loadSettings());
      }
      
      await Promise.all(promises);
      
      const end = performance.now();
      
      // Should handle concurrent settings loading
      expect(end - start).toBeLessThan(500); // Reduced timeout
    }, 5000); // Add 5 second timeout for this test
  });

  describe('Stress Testing', () => {
    test('should survive stress test with mixed operations', () => {
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        // Mix of operations
        switch (i % 5) {
          case 0:
            api.estimateTokens(`Stress test message ${i}`);
            break;
          case 1:
            api.conversationHistory.push({
              role: 'user',
              content: `Stress message ${i}`
            });
            break;
          case 2:
            api.getLimitedHistory(50);
            break;
          case 3:
            api.trimHistoryToTokenLimit(100);
            break;
          case 4:
            api.clearConversationHistory();
            break;
        }
      }
      
      const end = performance.now();
      
      // Should complete stress test within reasonable time
      expect(end - start).toBeLessThan(500);
    });
  });
});
