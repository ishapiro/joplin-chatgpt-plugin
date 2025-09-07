import { ChatGPTAPI } from '../src/chatgpt-api';
import axios from 'axios';

// Mock axios for testing
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock the settings to use environment variables
jest.mock('../src/settings', () => ({
  getSettings: jest.fn().mockImplementation(async () => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      throw new Error('OPENAI_API_KEY not set in environment variables');
    }
    
    return {
      openaiApiKey: apiKey,
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '1000'),
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
      systemPrompt: 'You are a helpful AI assistant integrated with Joplin note-taking app.'
    };
  }),
}));

describe('OpenAI Integration Tests', () => {
  let chatGPT: ChatGPTAPI;

  beforeEach(() => {
    chatGPT = new ChatGPTAPI();
    jest.clearAllMocks();
  });

  describe('Environment Configuration', () => {
    it('should require OPENAI_API_KEY environment variable', async () => {
      // Temporarily remove the API key
      const originalApiKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      await expect(chatGPT.initialize()).rejects.toThrow(
        'OPENAI_API_KEY not set in environment variables'
      );

      // Restore the API key
      if (originalApiKey) {
        process.env.OPENAI_API_KEY = originalApiKey;
      }
    });

    it('should use environment variables for configuration', async () => {
      // Set test environment variables
      process.env.OPENAI_API_KEY = 'test-api-key';
      process.env.OPENAI_MODEL = 'gpt-4';
      process.env.OPENAI_MAX_TOKENS = '2000';
      process.env.OPENAI_TEMPERATURE = '0.5';

      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: 'Test response from OpenAI',
              },
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 5,
            total_tokens: 15,
          },
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const messages = [
        { role: 'user' as const, content: 'Hello, ChatGPT!' },
      ];

      const result = await chatGPT.sendMessage(messages);

      expect(result.content).toBe('Test response from OpenAI');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: messages,
          max_tokens: 2000,
          temperature: 0.5,
        },
        {
          headers: {
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json',
          },
        }
      );
    });
  });

  describe('Real OpenAI API Integration', () => {
    it('should make actual API call when OPENAI_API_KEY is set', async () => {
      const apiKey = process.env.OPENAI_API_KEY;
      
      // Skip this test if no real API key is provided
      if (!apiKey || apiKey === 'your_openai_api_key_here') {
        console.log('Skipping real API test - no valid OPENAI_API_KEY provided');
        return;
      }

      // Don't mock axios for this test - use real API
      jest.unmock('axios');

      try {
        const result = await chatGPT.sendMessage([
          { role: 'system', content: 'You are a helpful assistant. Respond with exactly: "API test successful"' },
          { role: 'user', content: 'Test message' }
        ]);

        expect(result.content).toBeDefined();
        expect(result.content.length).toBeGreaterThan(0);
        expect(result.usage).toBeDefined();
        expect(result.usage!.total_tokens).toBeGreaterThan(0);
        
        console.log('✅ Real OpenAI API integration test passed');
        console.log(`Response: ${result.content}`);
        console.log(`Tokens used: ${result.usage!.total_tokens}`);
      } catch (error: any) {
        console.error('❌ Real OpenAI API integration test failed:', error.message);
        throw error;
      } finally {
        // Re-mock axios for other tests
        jest.doMock('axios');
      }
    });

    it('should handle rate limiting gracefully', async () => {
      const apiKey = process.env.OPENAI_API_KEY;
      
      if (!apiKey || apiKey === 'your_openai_api_key_here') {
        console.log('Skipping rate limit test - no valid OPENAI_API_KEY provided');
        return;
      }

      // Mock a rate limit response
      const rateLimitError = {
        response: {
          status: 429,
          data: {
            error: {
              message: 'Rate limit exceeded',
            },
          },
        },
      };

      mockedAxios.post.mockRejectedValue(rateLimitError);

      await expect(chatGPT.sendMessage([
        { role: 'user', content: 'Test message' }
      ])).rejects.toThrow('Rate limit exceeded. Please try again later.');
    });

    it('should handle invalid API key gracefully', async () => {
      // Mock an invalid API key response
      const invalidKeyError = {
        response: {
          status: 401,
          data: {
            error: {
              message: 'Invalid API key',
            },
          },
        },
      };

      mockedAxios.post.mockRejectedValue(invalidKeyError);

      await expect(chatGPT.sendMessage([
        { role: 'user', content: 'Test message' }
      ])).rejects.toThrow('Invalid API key. Please check your OpenAI API key in settings.');
    });
  });

  describe('Note Processing Features', () => {
    it('should improve note content with real API when available', async () => {
      const apiKey = process.env.OPENAI_API_KEY;
      
      if (!apiKey || apiKey === 'your_openai_api_key_here') {
        console.log('Skipping note improvement test - no valid OPENAI_API_KEY provided');
        return;
      }

      // Initialize the ChatGPT instance first
      await chatGPT.initialize();

      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: 'This is an improved version of the note with better grammar and structure.',
              },
            },
          ],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const noteContent = 'This is a note that needs improvement. It has some grammar issues and could be better organized.';
      const result = await chatGPT.improveNote(noteContent);

      expect(result).toBe('This is an improved version of the note with better grammar and structure.');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('improve the following note'),
            }),
            expect.objectContaining({
              role: 'user',
              content: noteContent,
            }),
          ]),
        }),
        expect.any(Object)
      );
    });

    it('should generate tags for note content', async () => {
      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: 'productivity, notes, organization, joplin',
              },
            },
          ],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const noteContent = 'This is a note about productivity and organization using Joplin.';
      const result = await chatGPT.generateTags(noteContent);

      expect(result).toEqual(['productivity', 'notes', 'organization', 'joplin']);
    });

    it('should summarize note content', async () => {
      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: 'This note discusses productivity techniques and organization methods for note-taking.',
              },
            },
          ],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const noteContent = 'This is a long note about productivity techniques, organization methods, and how to effectively use note-taking apps like Joplin for better personal organization.';
      const result = await chatGPT.summarizeNote(noteContent);

      expect(result).toBe('This note discusses productivity techniques and organization methods for note-taking.');
    });
  });
});
