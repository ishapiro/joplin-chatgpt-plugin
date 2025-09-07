import { setupSettings, getSettings, updateSetting, DEFAULT_SETTINGS } from '../src/settings';
import joplin from '../test/mocks/api';

// Mock the Joplin API
jest.mock('../test/mocks/api');

describe('Settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setupSettings', () => {
    it('should register all required settings', async () => {
      await setupSettings();

      expect(joplin.settings.registerSetting).toHaveBeenCalledWith('openaiApiKey', {
        value: DEFAULT_SETTINGS.openaiApiKey,
        type: joplin.settings.settingType.String,
        secure: true,
        label: 'OpenAI API Key',
        description: 'Your OpenAI API key for ChatGPT integration. Get one from https://platform.openai.com/api-keys',
        public: false
      });

      expect(joplin.settings.registerSetting).toHaveBeenCalledWith('model', {
        value: DEFAULT_SETTINGS.model,
        type: joplin.settings.settingType.String,
        label: 'ChatGPT Model',
        description: 'The ChatGPT model to use (gpt-3.5-turbo, gpt-4, etc.)',
        options: {
          'gpt-3.5-turbo': 'GPT-3.5 Turbo (Fast, Cost-effective)',
          'gpt-4': 'GPT-4 (More capable, Higher cost)',
          'gpt-4-turbo': 'GPT-4 Turbo (Latest, Most capable)'
        }
      });

      expect(joplin.settings.registerSetting).toHaveBeenCalledWith('maxTokens', {
        value: DEFAULT_SETTINGS.maxTokens,
        type: joplin.settings.settingType.Int,
        label: 'Max Tokens',
        description: 'Maximum number of tokens in the response (1-4000)',
        minimum: 1,
        maximum: 4000
      });

      expect(joplin.settings.registerSetting).toHaveBeenCalledWith('temperature', {
        value: DEFAULT_SETTINGS.temperature,
        type: joplin.settings.settingType.Float,
        label: 'Temperature',
        description: 'Controls randomness in responses (0.0 = deterministic, 1.0 = creative)',
        minimum: 0.0,
        maximum: 1.0,
        step: 0.1
      });

      expect(joplin.settings.registerSetting).toHaveBeenCalledWith('systemPrompt', {
        value: DEFAULT_SETTINGS.systemPrompt,
        type: joplin.settings.settingType.String,
        label: 'System Prompt',
        description: 'The system prompt that defines ChatGPT\'s behavior',
        multiline: true
      });
    });
  });

  describe('getSettings', () => {
    it('should retrieve all settings', async () => {
      const mockSettings = {
        openaiApiKey: 'test-key',
        model: 'gpt-4',
        maxTokens: 2000,
        temperature: 0.5,
        systemPrompt: 'Custom system prompt',
      };

      // Mock the settings.value calls
      (joplin.settings.value as jest.Mock)
        .mockResolvedValueOnce(mockSettings.openaiApiKey)
        .mockResolvedValueOnce(mockSettings.model)
        .mockResolvedValueOnce(mockSettings.maxTokens)
        .mockResolvedValueOnce(mockSettings.temperature)
        .mockResolvedValueOnce(mockSettings.systemPrompt);

      const result = await getSettings();

      expect(result).toEqual(mockSettings);
      expect(joplin.settings.value).toHaveBeenCalledTimes(5);
    });
  });

  describe('updateSetting', () => {
    it('should update a specific setting', async () => {
      await updateSetting('model', 'gpt-4');

      expect(joplin.settings.setValue).toHaveBeenCalledWith('model', 'gpt-4');
    });
  });
});
