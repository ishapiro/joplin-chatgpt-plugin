import joplin from 'api';
import { ChatGPTAPI } from './chatgpt-api';

const chatGPT = new ChatGPTAPI();

export async function setupCommands(): Promise<void> {
  // Command to improve current note
  await joplin.commands.register({
    name: 'improveNoteWithChatGPT',
    label: 'Improve Note with ChatGPT',
    iconName: 'fas fa-magic',
    execute: async () => {
      try {
        const note = await joplin.workspace.selectedNote();
        if (!note) {
          await joplin.views.dialogs.showMessageBox('Please select a note first.');
          return;
        }

        await joplin.views.dialogs.showMessageBox('Improving note with ChatGPT...');
        
        const improvedContent = await chatGPT.improveNote(note.body);
        await joplin.data.put(['notes', note.id], null, { body: improvedContent });
        
        await joplin.views.dialogs.showMessageBox('Note improved successfully!');
      } catch (error: any) {
        await joplin.views.dialogs.showErrorMessageBox(`Error improving note: ${error.message}`);
      }
    },
  });

  // Command to use current note as prompt
  await joplin.commands.register({
    name: 'useNoteAsPrompt',
    label: 'Use Note as ChatGPT Prompt',
    iconName: 'fas fa-comment',
    execute: async () => {
      try {
        const note = await joplin.workspace.selectedNote();
        if (!note) {
          await joplin.views.dialogs.showMessageBox('Please select a note first.');
          return;
        }

        const userPrompt = await joplin.views.dialogs.showPrompt(
          'Enter your prompt for ChatGPT:',
          'How would you like ChatGPT to help with this note?'
        );

        if (userPrompt === null) return; // User cancelled

        await joplin.views.dialogs.showMessageBox('Processing with ChatGPT...');
        
        const response = await chatGPT.useNoteAsPrompt(note.body, userPrompt);
        
        // Show response in dialog with option to copy or replace note
        const action = await joplin.views.dialogs.showMessageBox(
          `ChatGPT Response:\n\n${response}\n\nWhat would you like to do?`,
          'ChatGPT Response',
          ['Copy to Clipboard', 'Replace Note', 'Cancel']
        );

        switch (action) {
          case 0: // Copy to Clipboard
            await joplin.clipboard.writeText(response);
            await joplin.views.dialogs.showMessageBox('Response copied to clipboard!');
            break;
          case 1: // Replace Note
            await joplin.data.put(['notes', note.id], null, { body: response });
            await joplin.views.dialogs.showMessageBox('Note replaced with ChatGPT response!');
            break;
        }
      } catch (error: any) {
        await joplin.views.dialogs.showErrorMessageBox(`Error: ${error.message}`);
      }
    },
  });

  // Command to replace entire note with ChatGPT output
  await joplin.commands.register({
    name: 'replaceNoteWithChatGPT',
    label: 'Replace Note with ChatGPT Output',
    iconName: 'fas fa-edit',
    execute: async () => {
      try {
        const note = await joplin.workspace.selectedNote();
        if (!note) {
          await joplin.views.dialogs.showMessageBox('Please select a note first.');
          return;
        }

        const userPrompt = await joplin.views.dialogs.showPrompt(
          'What should ChatGPT do with this note?',
          'Enter your instruction for ChatGPT:'
        );

        if (userPrompt === null) return;

        await joplin.views.dialogs.showMessageBox('Processing with ChatGPT...');
        
        const response = await chatGPT.useNoteAsPrompt(note.body, userPrompt);
        await joplin.data.put(['notes', note.id], null, { body: response });
        
        await joplin.views.dialogs.showMessageBox('Note replaced with ChatGPT output!');
      } catch (error: any) {
        await joplin.views.dialogs.showErrorMessageBox(`Error: ${error.message}`);
      }
    },
  });

  // Command to replace selected text with ChatGPT output
  await joplin.commands.register({
    name: 'replaceSelectionWithChatGPT',
    label: 'Replace Selection with ChatGPT Output',
    iconName: 'fas fa-highlighter',
    execute: async () => {
      try {
        const selectedText = await joplin.commands.execute('editor.selectedText');
        if (!selectedText) {
          await joplin.views.dialogs.showMessageBox('Please select some text first.');
          return;
        }

        const userPrompt = await joplin.views.dialogs.showPrompt(
          'What should ChatGPT do with the selected text?',
          'Enter your instruction for ChatGPT:'
        );

        if (userPrompt === null) return;

        await joplin.views.dialogs.showMessageBox('Processing with ChatGPT...');
        
        const response = await chatGPT.useNoteAsPrompt(selectedText, userPrompt);
        await joplin.commands.execute('editor.replaceSelection', response);
        
        await joplin.views.dialogs.showMessageBox('Selection replaced with ChatGPT output!');
      } catch (error: any) {
        await joplin.views.dialogs.showErrorMessageBox(`Error: ${error.message}`);
      }
    },
  });

  // Command to copy ChatGPT output to clipboard
  await joplin.commands.register({
    name: 'copyChatGPTOutput',
    label: 'Copy ChatGPT Output to Clipboard',
    iconName: 'fas fa-copy',
    execute: async () => {
      try {
        const note = await joplin.workspace.selectedNote();
        if (!note) {
          await joplin.views.dialogs.showMessageBox('Please select a note first.');
          return;
        }

        const userPrompt = await joplin.views.dialogs.showPrompt(
          'What should ChatGPT generate?',
          'Enter your prompt for ChatGPT:'
        );

        if (userPrompt === null) return;

        await joplin.views.dialogs.showMessageBox('Generating with ChatGPT...');
        
        const response = await chatGPT.useNoteAsPrompt(note.body, userPrompt);
        await joplin.clipboard.writeText(response);
        
        await joplin.views.dialogs.showMessageBox('ChatGPT output copied to clipboard!');
      } catch (error: any) {
        await joplin.views.dialogs.showErrorMessageBox(`Error: ${error.message}`);
      }
    },
  });

  // Additional helpful commands

  // Command to generate tags for current note
  await joplin.commands.register({
    name: 'generateTagsWithChatGPT',
    label: 'Generate Tags with ChatGPT',
    iconName: 'fas fa-tags',
    execute: async () => {
      try {
        const note = await joplin.workspace.selectedNote();
        if (!note) {
          await joplin.views.dialogs.showMessageBox('Please select a note first.');
          return;
        }

        await joplin.views.dialogs.showMessageBox('Generating tags with ChatGPT...');
        
        const tags = await chatGPT.generateTags(note.body);
        const tagsString = tags.join(', ');
        
        const action = await joplin.views.dialogs.showMessageBox(
          `Generated tags: ${tagsString}\n\nWould you like to add these tags to the note?`,
          'Generated Tags',
          ['Add Tags', 'Copy Tags', 'Cancel']
        );

        switch (action) {
          case 0: // Add Tags
            const currentTags = note.tags || [];
            const newTags = [...currentTags, ...tags];
            await joplin.data.put(['notes', note.id], null, { tags: newTags });
            await joplin.views.dialogs.showMessageBox('Tags added to note!');
            break;
          case 1: // Copy Tags
            await joplin.clipboard.writeText(tagsString);
            await joplin.views.dialogs.showMessageBox('Tags copied to clipboard!');
            break;
        }
      } catch (error: any) {
        await joplin.views.dialogs.showErrorMessageBox(`Error: ${error.message}`);
      }
    },
  });

  // Command to summarize current note
  await joplin.commands.register({
    name: 'summarizeNoteWithChatGPT',
    label: 'Summarize Note with ChatGPT',
    iconName: 'fas fa-compress',
    execute: async () => {
      try {
        const note = await joplin.workspace.selectedNote();
        if (!note) {
          await joplin.views.dialogs.showMessageBox('Please select a note first.');
          return;
        }

        await joplin.views.dialogs.showMessageBox('Summarizing note with ChatGPT...');
        
        const summary = await chatGPT.summarizeNote(note.body);
        
        const action = await joplin.views.dialogs.showMessageBox(
          `Summary:\n\n${summary}\n\nWhat would you like to do?`,
          'Note Summary',
          ['Copy Summary', 'Create New Note', 'Cancel']
        );

        switch (action) {
          case 0: // Copy Summary
            await joplin.clipboard.writeText(summary);
            await joplin.views.dialogs.showMessageBox('Summary copied to clipboard!');
            break;
          case 1: // Create New Note
            const summaryNote = await joplin.data.post(['notes'], {
              title: `Summary: ${note.title}`,
              body: summary,
              parent_id: note.parent_id
            });
            await joplin.views.dialogs.showMessageBox('Summary note created!');
            break;
        }
      } catch (error: any) {
        await joplin.views.dialogs.showErrorMessageBox(`Error: ${error.message}`);
      }
    },
  });

  // Command to open ChatGPT settings
  await joplin.commands.register({
    name: 'openChatGPTSettings',
    label: 'Open ChatGPT Settings',
    iconName: 'fas fa-cog',
    execute: async () => {
      await joplin.commands.execute('openSettings', 'joplin-plugin-chatgpt');
    },
  });
}
