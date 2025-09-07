import joplin from 'api';

export interface PluginSettings {
  openaiApiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  systemPrompt: string;
}

export const DEFAULT_SETTINGS: PluginSettings = {
  openaiApiKey: '',
  model: 'gpt-3.5-turbo',
  maxTokens: 1000,
  temperature: 0.7,
  systemPrompt: 'You are a helpful AI assistant integrated with Joplin note-taking app. Help users improve their notes, answer questions, and provide writing assistance.'
};

export async function setupSettings(): Promise<void> {
  // Register API Key setting (secure)
  await joplin.settings.registerSetting('openaiApiKey', {
    value: DEFAULT_SETTINGS.openaiApiKey,
    type: joplin.settings.settingType.String,
    secure: true,
    label: 'OpenAI API Key',
    description: 'Your OpenAI API key for ChatGPT integration. Get one from https://platform.openai.com/api-keys',
    public: false
  });

  // Register model setting
  await joplin.settings.registerSetting('model', {
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

  // Register max tokens setting
  await joplin.settings.registerSetting('maxTokens', {
    value: DEFAULT_SETTINGS.maxTokens,
    type: joplin.settings.settingType.Int,
    label: 'Max Tokens',
    description: 'Maximum number of tokens in the response (1-4000)',
    minimum: 1,
    maximum: 4000
  });

  // Register temperature setting
  await joplin.settings.registerSetting('temperature', {
    value: DEFAULT_SETTINGS.temperature,
    type: joplin.settings.settingType.Float,
    label: 'Temperature',
    description: 'Controls randomness in responses (0.0 = deterministic, 1.0 = creative)',
    minimum: 0.0,
    maximum: 1.0,
    step: 0.1
  });

  // Register system prompt setting
  await joplin.settings.registerSetting('systemPrompt', {
    value: DEFAULT_SETTINGS.systemPrompt,
    type: joplin.settings.settingType.String,
    label: 'System Prompt',
    description: 'The system prompt that defines ChatGPT\'s behavior',
    multiline: true
  });
}

export async function getSettings(): Promise<PluginSettings> {
  return {
    openaiApiKey: await joplin.settings.value('openaiApiKey'),
    model: await joplin.settings.value('model'),
    maxTokens: await joplin.settings.value('maxTokens'),
    temperature: await joplin.settings.value('temperature'),
    systemPrompt: await joplin.settings.value('systemPrompt')
  };
}

export async function updateSetting(key: keyof PluginSettings, value: any): Promise<void> {
  await joplin.settings.setValue(key, value);
}
