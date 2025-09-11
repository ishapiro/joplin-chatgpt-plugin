// Integration tests for plugin commands and webview interactions
const fs = require('fs');
const path = require('path');

// Enhanced mock for Joplin API with more realistic behavior
const mockJoplin = {
  plugins: {
    register: jest.fn()
  },
  settings: {
    registerSection: jest.fn(),
    registerSettings: jest.fn(),
    value: jest.fn()
  },
  commands: {
    register: jest.fn(),
    execute: jest.fn()
  },
  views: {
    panels: {
      create: jest.fn(),
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
    selectedNoteIds: jest.fn()
  },
  clipboard: {
    writeText: jest.fn()
  }
};

// Mock global objects
global.joplin = mockJoplin;
global.fetch = jest.fn();
global.AbortController = jest.fn(() => ({
  signal: {},
  abort: jest.fn()
}));
global.setTimeout = jest.fn((cb, delay) => setTimeout(cb, 0)); // Fast timeout for tests
global.clearTimeout = jest.fn();
global.console = {
  ...console,
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn()
};

describe('Plugin Integration Tests', () => {
  let pluginInstance;
  let registeredCommands = {};
  let panelMessageHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    registeredCommands = {};
    panelMessageHandler = null;

    // Mock command registration to capture commands
    mockJoplin.commands.register.mockImplementation((config) => {
      registeredCommands[config.name] = config;
      return Promise.resolve();
    });

    // Mock panel message handler registration
    mockJoplin.views.panels.onMessage.mockImplementation((panelId, handler) => {
      panelMessageHandler = handler;
      return Promise.resolve();
    });

    // Mock panel creation
    mockJoplin.views.panels.create.mockResolvedValue('test-panel-id');

    // Mock settings
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

    // Mock workspace
    mockJoplin.workspace.selectedNoteIds.mockResolvedValue(['note-123']);
    mockJoplin.data.get.mockImplementation((path) => {
      if (path[0] === 'notes' && path[1] === 'note-123') {
        return Promise.resolve({
          id: 'note-123',
          title: 'Test Note',
          body: 'This is a test note content.',
          parent_id: 'folder-456'
        });
      }
      if (path[0] === 'folders') {
        return Promise.resolve({
          items: [{ id: 'folder-456', title: 'Test Folder' }]
        });
      }
      return Promise.resolve({});
    });
  });

  describe('Plugin Registration', () => {
    test('should register plugin with onStart function', async () => {
      // Load and execute plugin
      const pluginCode = fs.readFileSync(path.join(__dirname, '../dist/index.js'), 'utf8');
      const vm = require('vm');
      const context = vm.createContext({
        joplin: mockJoplin,
        fetch: global.fetch,
        AbortController: global.AbortController,
        setTimeout: global.setTimeout,
        clearTimeout: global.clearTimeout,
        console: global.console,
        Math: Math,
        JSON: JSON,
        Error: Error
      });

      vm.runInContext(pluginCode, context);

      expect(mockJoplin.plugins.register).toHaveBeenCalledWith({
        onStart: expect.any(Function)
      });

      // Execute the onStart function
      const registrationCall = mockJoplin.plugins.register.mock.calls[0][0];
      await registrationCall.onStart();

      // Verify settings were registered
      expect(mockJoplin.settings.registerSection).toHaveBeenCalledWith(
        'chatgptToolkit',
        expect.objectContaining({
          label: 'ChatGPT Toolkit'
        })
      );

      expect(mockJoplin.settings.registerSettings).toHaveBeenCalled();
    });
  });

  describe('Command Registration', () => {
    beforeEach(async () => {
      // Initialize plugin
      const pluginCode = fs.readFileSync(path.join(__dirname, '../dist/index.js'), 'utf8');
      const vm = require('vm');
      const context = vm.createContext({
        joplin: mockJoplin,
        fetch: global.fetch,
        AbortController: global.AbortController,
        setTimeout: global.setTimeout,
        clearTimeout: global.clearTimeout,
        console: global.console,
        Math: Math,
        JSON: JSON,
        Error: Error
      });

      vm.runInContext(pluginCode, context);
      const registrationCall = mockJoplin.plugins.register.mock.calls[0][0];
      await registrationCall.onStart();
    });

    test('should register all expected commands', () => {
      const expectedCommands = [
        'checkGrammarWithChatGPT',
        'copyChatGPTResponseToClipboard',
        'useNoteAsChatGPTPrompt',
        'openChatGPTPanel',
        'toggleChatGPTToolbox'
      ];

      expectedCommands.forEach(commandName => {
        expect(registeredCommands[commandName]).toBeDefined();
        expect(typeof registeredCommands[commandName].execute).toBe('function');
      });
    });

    test('checkGrammarWithChatGPT should handle no selected text', async () => {
      mockJoplin.commands.execute.mockResolvedValue(''); // No selected text

      await registeredCommands.checkGrammarWithChatGPT.execute();

      expect(mockJoplin.views.dialogs.showMessageBox).toHaveBeenCalledWith(
        'Please select some text to check grammar.'
      );
    });

    test('copyChatGPTResponseToClipboard should handle no response available', async () => {
      await registeredCommands.copyChatGPTResponseToClipboard.execute();

      expect(mockJoplin.views.dialogs.showMessageBox).toHaveBeenCalledWith(
        'No ChatGPT response available. Send a message first.'
      );
    });

    test('useNoteAsChatGPTPrompt should use current note content', async () => {
      // Mock successful API response
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: { get: jest.fn(() => 'application/json') },
        text: jest.fn().mockResolvedValue(JSON.stringify({
          choices: [{ message: { content: 'AI response to note content' } }]
        }))
      });

      await registeredCommands.useNoteAsChatGPTPrompt.execute();

      expect(mockJoplin.workspace.selectedNoteIds).toHaveBeenCalled();
      expect(mockJoplin.data.get).toHaveBeenCalledWith(
        ['notes', 'note-123'],
        { fields: ['id', 'title', 'body'] }
      );
      expect(global.fetch).toHaveBeenCalled();
      expect(mockJoplin.views.dialogs.showMessageBox).toHaveBeenCalledWith(
        expect.stringContaining('AI response to note content')
      );
    });

    test('openChatGPTPanel should show the panel', async () => {
      await registeredCommands.openChatGPTPanel.execute();

      expect(mockJoplin.views.panels.show).toHaveBeenCalled();
    });

    test('toggleChatGPTToolbox should toggle panel visibility', async () => {
      // Test showing panel when hidden
      mockJoplin.views.panels.visible.mockResolvedValue(false);
      await registeredCommands.toggleChatGPTToolbox.execute();
      expect(mockJoplin.views.panels.show).toHaveBeenCalled();

      // Test hiding panel when visible
      mockJoplin.views.panels.visible.mockResolvedValue(true);
      await registeredCommands.toggleChatGPTToolbox.execute();
      expect(mockJoplin.views.panels.hide).toHaveBeenCalled();
    });
  });

  describe('Panel Setup', () => {
    beforeEach(async () => {
      // Initialize plugin
      const pluginCode = fs.readFileSync(path.join(__dirname, '../dist/index.js'), 'utf8');
      const vm = require('vm');
      const context = vm.createContext({
        joplin: mockJoplin,
        fetch: global.fetch,
        AbortController: global.AbortController,
        setTimeout: global.setTimeout,
        clearTimeout: global.clearTimeout,
        console: global.console,
        Math: Math,
        JSON: JSON,
        Error: Error
      });

      vm.runInContext(pluginCode, context);
      const registrationCall = mockJoplin.plugins.register.mock.calls[0][0];
      await registrationCall.onStart();
    });

    test('should create and configure chat panel', () => {
      expect(mockJoplin.views.panels.create).toHaveBeenCalledWith('chatgpt.toolbox.panel');
      expect(mockJoplin.views.panels.setHtml).toHaveBeenCalled();
      expect(mockJoplin.views.panels.addScript).toHaveBeenCalledWith('test-panel-id', 'webview.js');
      expect(mockJoplin.views.panels.show).toHaveBeenCalled();
      expect(mockJoplin.views.panels.onMessage).toHaveBeenCalled();
    });

    test('should handle panel HTML content correctly', () => {
      const setHtmlCall = mockJoplin.views.panels.setHtml.mock.calls[0];
      const htmlContent = setHtmlCall[1];

      expect(htmlContent).toContain('ChatGPT Toolkit');
      expect(htmlContent).toContain('chat-container');
      expect(htmlContent).toContain('sendButton');
      expect(htmlContent).toContain('chatInput');
      expect(htmlContent).toContain('action-button');
    });
  });

  describe('Webview Message Handling', () => {
    beforeEach(async () => {
      // Initialize plugin to set up message handler
      const pluginCode = fs.readFileSync(path.join(__dirname, '../dist/index.js'), 'utf8');
      const vm = require('vm');
      const context = vm.createContext({
        joplin: mockJoplin,
        fetch: global.fetch,
        AbortController: global.AbortController,
        setTimeout: global.setTimeout,
        clearTimeout: global.clearTimeout,
        console: global.console,
        Math: Math,
        JSON: JSON,
        Error: Error
      });

      vm.runInContext(pluginCode, context);
      const registrationCall = mockJoplin.plugins.register.mock.calls[0][0];
      await registrationCall.onStart();
    });

    test('should handle sendChatMessage', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: { get: jest.fn(() => 'application/json') },
        text: jest.fn().mockResolvedValue(JSON.stringify({
          choices: [{ message: { content: 'Hello from ChatGPT!' } }]
        }))
      });

      const response = await panelMessageHandler({
        type: 'sendChatMessage',
        message: 'Hello'
      });

      expect(response.success).toBe(true);
      expect(response.content).toBe('Hello from ChatGPT!');
      expect(global.fetch).toHaveBeenCalled();
    });

    test('should handle clearHistory', async () => {
      const response = await panelMessageHandler({
        type: 'clearHistory'
      });

      expect(response.success).toBe(true);
      expect(response.message).toBe('Conversation history cleared');
    });

    test('should handle closePanel', async () => {
      const response = await panelMessageHandler({
        type: 'closePanel'
      });

      expect(response.success).toBe(true);
      expect(mockJoplin.views.panels.postMessage).toHaveBeenCalledWith(
        'test-panel-id',
        { type: 'showCloseMessage' }
      );
    });

    test('should handle confirmClose', async () => {
      const response = await panelMessageHandler({
        type: 'confirmClose'
      });

      expect(response.success).toBe(true);
      expect(mockJoplin.views.panels.hide).toHaveBeenCalledWith('test-panel-id');
    });

    test('should handle executeAction - appendToNote', async () => {
      // First send a message to create a response
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: { get: jest.fn(() => 'application/json') },
        text: jest.fn().mockResolvedValue(JSON.stringify({
          choices: [{ message: { content: 'Test response' } }]
        }))
      });

      await panelMessageHandler({
        type: 'sendChatMessage',
        message: 'Hello'
      });

      // Now test appendToNote action
      const response = await panelMessageHandler({
        type: 'executeAction',
        action: 'appendToNote'
      });

      expect(response.success).toBe(true);
      expect(mockJoplin.data.put).toHaveBeenCalledWith(
        ['notes', 'note-123'],
        null,
        { body: expect.stringContaining('Test response') }
      );
    });

    test('should handle executeAction - createNewNote', async () => {
      // First send a message
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: { get: jest.fn(() => 'application/json') },
        text: jest.fn().mockResolvedValue(JSON.stringify({
          choices: [{ message: { content: 'New note content' } }]
        }))
      });

      await panelMessageHandler({
        type: 'sendChatMessage',
        message: 'Create a note'
      });

      // Mock note creation
      mockJoplin.data.post.mockResolvedValue({ id: 'new-note-456' });

      const response = await panelMessageHandler({
        type: 'executeAction',
        action: 'createNewNote'
      });

      expect(response.success).toBe(true);
      expect(mockJoplin.data.post).toHaveBeenCalledWith(
        ['notes'],
        null,
        expect.objectContaining({
          body: 'New note content',
          parent_id: 'folder-456'
        })
      );
      expect(mockJoplin.commands.execute).toHaveBeenCalledWith('openNote', 'new-note-456');
    });

    test('should handle acceptGrammarChanges', async () => {
      const response = await panelMessageHandler({
        type: 'acceptGrammarChanges',
        correctedText: 'Corrected text here'
      });

      expect(response.success).toBe(true);
      expect(mockJoplin.commands.execute).toHaveBeenCalledWith(
        'replaceSelection',
        'Corrected text here'
      );
    });

    test('should handle unknown message type', async () => {
      const response = await panelMessageHandler({
        type: 'unknownType'
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('Unknown message type');
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      // Initialize plugin
      const pluginCode = fs.readFileSync(path.join(__dirname, '../dist/index.js'), 'utf8');
      const vm = require('vm');
      const context = vm.createContext({
        joplin: mockJoplin,
        fetch: global.fetch,
        AbortController: global.AbortController,
        setTimeout: global.setTimeout,
        clearTimeout: global.clearTimeout,
        console: global.console,
        Math: Math,
        JSON: JSON,
        Error: Error
      });

      vm.runInContext(pluginCode, context);
      const registrationCall = mockJoplin.plugins.register.mock.calls[0][0];
      await registrationCall.onStart();
    });

    test('should handle API errors in sendChatMessage', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: { get: jest.fn(() => 'application/json') },
        text: jest.fn().mockResolvedValue(JSON.stringify({
          error: { message: 'Invalid API key' }
        }))
      });

      const response = await panelMessageHandler({
        type: 'sendChatMessage',
        message: 'Hello'
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('OpenAI API error');
    });

    test('should handle Joplin API errors gracefully', async () => {
      mockJoplin.workspace.selectedNoteIds.mockRejectedValue(new Error('No workspace'));

      await registeredCommands.useNoteAsChatGPTPrompt.execute();

      expect(mockJoplin.views.dialogs.showMessageBox).toHaveBeenCalledWith(
        expect.stringContaining('Error:')
      );
    });

    test('should handle missing note selection', async () => {
      mockJoplin.workspace.selectedNoteIds.mockResolvedValue([]);

      await registeredCommands.useNoteAsChatGPTPrompt.execute();

      expect(mockJoplin.views.dialogs.showMessageBox).toHaveBeenCalledWith(
        expect.stringContaining('No note selected')
      );
    });
  });
});
