import { ChatGPTAPI, ChatMessage } from '../src/chatgpt-api';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock settings
jest.mock('../src/settings', () => ({
  getSettings: jest.fn().mockResolvedValue({
    openaiApiKey: 'test-api-key',
    model: 'gpt-3.5-turbo',
    maxTokens: 1000,
    temperature: 0.7,
    systemPrompt: 'Test system prompt',
  }),
}));

describe('ChatGPTAPI', () => {
  let chatGPT: ChatGPTAPI;

  beforeEach(() => {
    chatGPT = new ChatGPTAPI();
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should send a message and return response', async () => {
      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: 'Test response from ChatGPT',
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

      const messages: ChatMessage[] = [
        { role: 'user', content: 'Hello, ChatGPT!' },
      ];

      const result = await chatGPT.sendMessage(messages);

      expect(result.content).toBe('Test response from ChatGPT');
      expect(result.usage).toEqual(mockResponse.data.usage);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: messages,
          max_tokens: 1000,
          temperature: 0.7,
        },
        {
          headers: {
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json',
          },
        }
      );
    });

    it('should handle API errors correctly', async () => {
      const errorResponse = {
        response: {
          status: 401,
          data: {
            error: {
              message: 'Invalid API key',
            },
          },
        },
      };

      mockedAxios.post.mockRejectedValue(errorResponse);

      const messages: ChatMessage[] = [
        { role: 'user', content: 'Hello, ChatGPT!' },
      ];

      await expect(chatGPT.sendMessage(messages)).rejects.toThrow(
        'Invalid API key. Please check your OpenAI API key in settings.'
      );
    });

    it('should handle network errors', async () => {
      const networkError = {
        request: {},
        message: 'Network Error',
      };

      mockedAxios.post.mockRejectedValue(networkError);

      const messages: ChatMessage[] = [
        { role: 'user', content: 'Hello, ChatGPT!' },
      ];

      await expect(chatGPT.sendMessage(messages)).rejects.toThrow(
        'Network error. Please check your internet connection.'
      );
    });
  });

  describe('improveNote', () => {
    it('should improve note content', async () => {
      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: 'Improved note content',
              },
            },
          ],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      // Initialize the ChatGPT instance
      await chatGPT.initialize();

      const noteContent = 'Original note content';
      const result = await chatGPT.improveNote(noteContent);

      expect(result).toBe('Improved note content');
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
  });

  describe('generateTags', () => {
    it('should generate tags for note content', async () => {
      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: 'productivity, notes, organization',
              },
            },
          ],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      // Initialize the ChatGPT instance
      await chatGPT.initialize();

      const noteContent = 'This is a note about productivity and organization';
      const result = await chatGPT.generateTags(noteContent);

      expect(result).toEqual(['productivity', 'notes', 'organization']);
    });
  });

  describe('summarizeNote', () => {
    it('should summarize note content', async () => {
      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: 'This note discusses productivity techniques and organization methods.',
              },
            },
          ],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      // Initialize the ChatGPT instance
      await chatGPT.initialize();

      const noteContent = 'Long note content about productivity...';
      const result = await chatGPT.summarizeNote(noteContent);

      expect(result).toBe('This note discusses productivity techniques and organization methods.');
    });
  });
});
