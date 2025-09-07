import { setupCommands } from '../src/commands';
import joplin from '../test/mocks/api';

// Mock the Joplin API
jest.mock('../test/mocks/api');

// Mock ChatGPTAPI
jest.mock('../src/chatgpt-api', () => ({
  ChatGPTAPI: jest.fn().mockImplementation(() => ({
    improveNote: jest.fn(),
    useNoteAsPrompt: jest.fn(),
    generateTags: jest.fn(),
    summarizeNote: jest.fn(),
  })),
}));

describe('Commands', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setupCommands', () => {
    it('should register all required commands', async () => {
      await setupCommands();

      expect(joplin.commands.register).toHaveBeenCalledWith({
        name: 'improveNoteWithChatGPT',
        label: 'Improve Note with ChatGPT',
        iconName: 'fas fa-magic',
        execute: expect.any(Function),
      });

      expect(joplin.commands.register).toHaveBeenCalledWith({
        name: 'useNoteAsPrompt',
        label: 'Use Note as ChatGPT Prompt',
        iconName: 'fas fa-comment',
        execute: expect.any(Function),
      });

      expect(joplin.commands.register).toHaveBeenCalledWith({
        name: 'replaceNoteWithChatGPT',
        label: 'Replace Note with ChatGPT Output',
        iconName: 'fas fa-edit',
        execute: expect.any(Function),
      });

      expect(joplin.commands.register).toHaveBeenCalledWith({
        name: 'replaceSelectionWithChatGPT',
        label: 'Replace Selection with ChatGPT Output',
        iconName: 'fas fa-highlighter',
        execute: expect.any(Function),
      });

      expect(joplin.commands.register).toHaveBeenCalledWith({
        name: 'copyChatGPTOutput',
        label: 'Copy ChatGPT Output to Clipboard',
        iconName: 'fas fa-copy',
        execute: expect.any(Function),
      });

      expect(joplin.commands.register).toHaveBeenCalledWith({
        name: 'generateTagsWithChatGPT',
        label: 'Generate Tags with ChatGPT',
        iconName: 'fas fa-tags',
        execute: expect.any(Function),
      });

      expect(joplin.commands.register).toHaveBeenCalledWith({
        name: 'summarizeNoteWithChatGPT',
        label: 'Summarize Note with ChatGPT',
        iconName: 'fas fa-compress',
        execute: expect.any(Function),
      });

      expect(joplin.commands.register).toHaveBeenCalledWith({
        name: 'openChatGPTSettings',
        label: 'Open ChatGPT Settings',
        iconName: 'fas fa-cog',
        execute: expect.any(Function),
      });
    });
  });

  describe('Command execution', () => {
    it('should handle improveNoteWithChatGPT command', async () => {
      const mockNote = {
        id: 'test-note-id',
        title: 'Test Note',
        body: 'Original content',
      };

      (joplin.workspace.selectedNote as jest.Mock).mockResolvedValue(mockNote);
      (joplin.views.dialogs.showMessageBox as jest.Mock).mockResolvedValue(0);

      await setupCommands();

      // Get the registered command
      const registerCall = (joplin.commands.register as jest.Mock).mock.calls.find(
        call => call[0].name === 'improveNoteWithChatGPT'
      );
      const command = registerCall[0];

      // Execute the command
      await command.execute();

      expect(joplin.workspace.selectedNote).toHaveBeenCalled();
      expect(joplin.views.dialogs.showMessageBox).toHaveBeenCalledWith('Improving note with ChatGPT...');
    });

    it('should handle missing note selection', async () => {
      (joplin.workspace.selectedNote as jest.Mock).mockResolvedValue(null);

      await setupCommands();

      // Get the registered command
      const registerCall = (joplin.commands.register as jest.Mock).mock.calls.find(
        call => call[0].name === 'improveNoteWithChatGPT'
      );
      const command = registerCall[0];

      // Execute the command
      await command.execute();

      expect(joplin.views.dialogs.showMessageBox).toHaveBeenCalledWith('Please select a note first.');
    });
  });
});
