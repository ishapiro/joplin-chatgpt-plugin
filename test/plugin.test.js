// Plugin functionality tests
const fs = require('fs');
const path = require('path');

// Mock the Joplin API
const mockJoplin = require('./mocks/api');

// Load the plugin code
const pluginCode = fs.readFileSync(path.join(__dirname, '../src/index.js'), 'utf8');

describe('ChatGPT Toolkit Plugin Tests', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  test('should register plugin with Joplin', () => {
    // The plugin code should contain the registration call
    expect(pluginCode).toContain('joplin.plugins.register');
    expect(pluginCode).toContain('onStart');
  });

  test('should register all required settings', () => {
    expect(pluginCode).toContain('openaiApiKey');
    expect(pluginCode).toContain('openaiModel');
    expect(pluginCode).toContain('maxTokens');
    expect(pluginCode).toContain('temperature');
    expect(pluginCode).toContain('systemPrompt');
    expect(pluginCode).toContain('autoSave');
  });

  test('should register all ChatGPT commands', () => {
    const expectedCommands = [
      'improveNoteWithChatGPT',
      'summarizeNoteWithChatGPT',
      'generateTagsWithChatGPT',
      'expandNoteWithChatGPT',
      'fixGrammarWithChatGPT',
      'translateNoteWithChatGPT',
      'improveSelectedTextWithChatGPT',
      'replaceSelectedWithChatGPT',
      'copyChatGPTResponse',
      'useNoteAsChatGPTPrompt'
    ];

    expectedCommands.forEach(command => {
      expect(pluginCode).toContain(command);
    });
  });

  test('should create chat panel', () => {
    expect(pluginCode).toContain('chatgpt-chat-panel');
    expect(pluginCode).toContain('ChatGPT Toolkit');
    expect(pluginCode).toContain('Setting up ChatGPT chat panel');
  });

  test('should have ChatGPT API class', () => {
    expect(pluginCode).toContain('class ChatGPTAPI');
    expect(pluginCode).toContain('sendMessage');
    expect(pluginCode).toContain('improveNote');
    expect(pluginCode).toContain('summarizeNote');
    expect(pluginCode).toContain('generateTags');
  });

  test('should handle OpenAI API calls', () => {
    expect(pluginCode).toContain('https://api.openai.com/v1/chat/completions');
    expect(pluginCode).toContain('fetch');
    expect(pluginCode).toContain('Authorization');
  });

  test('should have proper error handling', () => {
    expect(pluginCode).toContain('try {');
    expect(pluginCode).toContain('catch (error)');
    expect(pluginCode).toContain('console.error');
  });

  test('should have console logging for debugging', () => {
    expect(pluginCode).toContain('console.info');
    expect(pluginCode).toContain('ChatGPT Toolkit Plugin started');
    expect(pluginCode).toContain('ChatGPT Toolkit Plugin initialized successfully');
  });
});
