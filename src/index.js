// ChatGPT Toolkit Plugin - Complete JavaScript Implementation
joplin.plugins.register({
  onStart: async function() {
    console.info('ChatGPT Toolkit Plugin started!');
    
    try {
      // ===== SETTINGS SETUP =====
      console.info('Setting up ChatGPT Toolkit settings...');
      
      // Create a settings section so options appear in Joplin's UI
      await joplin.settings.registerSection('chatgptToolkit', {
        label: 'ChatGPT Toolkit',
        iconName: 'fas fa-robot'
      });

      await joplin.settings.registerSettings({
        'openaiApiKey': {
          value: '',
          type: 2, // String (updated in newer Joplin versions)
          label: 'OpenAI API Key',
          description: 'Your OpenAI API key for ChatGPT access. Get one from https://platform.openai.com/api-keys',
          public: true,
          section: 'chatgptToolkit',
        },
        'openaiModel': {
          value: 'gpt-3.5-turbo',
          type: 2, // String (updated in newer Joplin versions)
          label: 'OpenAI Model',
          description: 'The OpenAI model to use (e.g., gpt-3.5-turbo, gpt-4)',
          public: true,
          section: 'chatgptToolkit',
        },
        'maxTokens': {
          value: 1000,
          type: 1, // Int (updated in newer Joplin versions)
          label: 'Max Tokens',
          description: 'Maximum number of tokens to generate in responses',
          public: true,
          section: 'chatgptToolkit',
        },
        'temperature': {
          value: 0.7,
          type: 1, // Int (updated in newer Joplin versions)
          label: 'Temperature',
          description: 'Controls randomness (0.0 = deterministic, 1.0 = very random)',
          public: true,
          section: 'chatgptToolkit',
        },
        'systemPrompt': {
          value: 'You are a helpful AI assistant from the ChatGPT Toolkit integrated with Joplin notes. Help users improve their notes, answer questions, and provide writing assistance.',
          type: 2, // String (updated in newer Joplin versions)
          label: 'System Prompt',
          description: 'The system prompt that defines how ChatGPT should behave',
          public: true,
          section: 'chatgptToolkit',
        },
        'autoSave': {
          value: true,
          type: 3, // Bool (updated in newer Joplin versions)
          label: 'Auto-save Changes',
          description: 'Automatically save note changes after AI operations',
          public: true,
          section: 'chatgptToolkit',
        }
      });
      
      console.info('ChatGPT Toolkit settings registered successfully!');

      // ===== CHATGPT API CLASS =====
      class ChatGPTAPI {
        constructor() {
          this.settings = {};
          this.initialized = false;
        }

        async initialize() {
          if (this.initialized) return;
          
          try {
            // Load settings
            this.settings = {
              apiKey: await joplin.settings.value('openaiApiKey'),
              model: await joplin.settings.value('openaiModel'),
              maxTokens: parseInt(await joplin.settings.value('maxTokens')),
              temperature: parseFloat(await joplin.settings.value('temperature')),
              systemPrompt: await joplin.settings.value('systemPrompt'),
              autoSave: await joplin.settings.value('autoSave')
            };
            
            this.initialized = true;
            console.info('ChatGPT API initialized with settings:', {
              model: this.settings.model,
              maxTokens: this.settings.maxTokens,
              temperature: this.settings.temperature,
              hasApiKey: !!this.settings.apiKey
            });
          } catch (error) {
            console.error('Failed to initialize ChatGPT API:', error);
            throw error;
          }
        }

        async sendMessage(message, context = '') {
          await this.initialize();
          
          if (!this.settings.apiKey) {
            throw new Error('OpenAI API key not configured. Please set it in plugin settings.');
          }

          try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.settings.apiKey}`
              },
              body: JSON.stringify({
                model: this.settings.model,
                messages: [
                  {
                    role: 'system',
                    content: this.settings.systemPrompt
                  },
                  ...(context ? [{
                    role: 'user',
                    content: `Context: ${context}\n\nRequest: ${message}`
                  }] : [{
                    role: 'user',
                    content: message
                  }])
                ],
                max_tokens: this.settings.maxTokens,
                temperature: this.settings.temperature
              })
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
          } catch (error) {
            console.error('ChatGPT API error:', error);
            throw error;
          }
        }

        async improveNote(noteContent) {
          const prompt = `Please improve the following note content. Make it more clear, well-structured, and professional while preserving all the important information:

${noteContent}

Please provide only the improved version without any additional commentary.`;
          
          return await this.sendMessage(prompt);
        }

        async summarizeNote(noteContent) {
          const prompt = `Please provide a concise summary of the following note content:

${noteContent}

Please provide only the summary without any additional commentary.`;
          
          return await this.sendMessage(prompt);
        }

        async generateTags(noteContent) {
          const prompt = `Based on the following note content, suggest 3-5 relevant tags (keywords) that would help with organization and searchability. Return only the tags separated by commas:

${noteContent}`;
          
          const response = await this.sendMessage(prompt);
          return response.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        }

        async expandNote(noteContent) {
          const prompt = `Please expand and elaborate on the following note content, adding more detail, examples, and context where appropriate:

${noteContent}

Please provide only the expanded version without any additional commentary.`;
          
          return await this.sendMessage(prompt);
        }

        async translateNote(noteContent, targetLanguage = 'English') {
          const prompt = `Please translate the following note content to ${targetLanguage}. Maintain the original formatting and structure:

${noteContent}

Please provide only the translation without any additional commentary.`;
          
          return await this.sendMessage(prompt);
        }

        async fixGrammar(noteContent) {
          const prompt = `Please fix any grammar, spelling, and punctuation errors in the following note content while preserving the original meaning and style:

${noteContent}

Please provide only the corrected version without any additional commentary.`;
          
          return await this.sendMessage(prompt);
        }
      }

      // Create global ChatGPT API instance
      const chatGPTAPI = new ChatGPTAPI();

      // ===== COMMANDS SETUP =====
      console.info('Setting up ChatGPT Toolkit commands...');

      // Helper function to get current note
      async function getCurrentNote() {
        const noteIds = await joplin.workspace.selectedNoteIds();
        if (noteIds.length === 0) {
          throw new Error('No note selected. Please select a note first.');
        }
        return await joplin.data.get(['notes', noteIds[0]], { fields: ['id', 'title', 'body'] });
      }

      // Helper function to get current folder ID
      async function getCurrentFolderId() {
        try {
          const noteIds = await joplin.workspace.selectedNoteIds();
          if (noteIds.length > 0) {
            const note = await joplin.data.get(['notes', noteIds[0]], { fields: ['parent_id'] });
            return note.parent_id;
          }
          // If no note selected, use the default folder
          const folders = await joplin.data.get(['folders'], { fields: ['id', 'title'] });
          const inboxFolder = folders.items.find(folder => folder.title === 'Inbox');
          return inboxFolder ? inboxFolder.id : folders.items[0].id;
        } catch (error) {
          console.error('Error getting current folder:', error);
          return null; // Let Joplin use default folder
        }
      }

      // Helper function to update note content
      async function updateNoteContent(noteId, newContent, autoSave = true) {
        await joplin.data.put(['notes', noteId], null, { body: newContent });
        if (autoSave) {
          // Note: Joplin auto-saves changes, no manual save command needed
          console.info('Note content updated successfully');
        }
      }

      // Helper function to get selected text
      async function getSelectedText() {
        return await joplin.commands.execute('editor.execCommand', {
          name: 'getSelectedText'
        });
      }

      // Helper function to replace selected text
      async function replaceSelectedText(newText) {
        await joplin.commands.execute('editor.execCommand', {
          name: 'replaceSelectedText',
          args: [newText]
        });
      }

      // Helper function to copy to clipboard
      async function copyToClipboard(text) {
        await joplin.clipboard.writeText(text);
      }

      // Helper function to get last ChatGPT response from chat
      let lastChatGPTResponse = '';
      

      // 1. Improve Note with ChatGPT
      await joplin.commands.register({
        name: 'improveNoteWithChatGPT',
        label: 'Improve Note with ChatGPT',
        execute: async () => {
          try {
            const note = await getCurrentNote();
            const improvedContent = await chatGPTAPI.improveNote(note.body);
            await updateNoteContent(note.id, improvedContent);
            await joplin.views.dialogs.showMessageBox('Note improved successfully with ChatGPT!');
          } catch (error) {
            await joplin.views.dialogs.showMessageBox(`Error: ${error.message}`);
          }
        },
      });

      // 2. Summarize Note with ChatGPT
      await joplin.commands.register({
        name: 'summarizeNoteWithChatGPT',
        label: 'Summarize Note with ChatGPT',
        execute: async () => {
          try {
            const note = await getCurrentNote();
            const summary = await chatGPTAPI.summarizeNote(note.body);
            await updateNoteContent(note.id, `# Summary\n\n${summary}\n\n---\n\n# Original Note\n\n${note.body}`);
            await joplin.views.dialogs.showMessageBox('Note summarized successfully with ChatGPT!');
          } catch (error) {
            await joplin.views.dialogs.showMessageBox(`Error: ${error.message}`);
          }
        },
      });

      // 3. Generate Tags with ChatGPT
      await joplin.commands.register({
        name: 'generateTagsWithChatGPT',
        label: 'Generate Tags with ChatGPT',
        execute: async () => {
          try {
            const note = await getCurrentNote();
            const tags = await chatGPTAPI.generateTags(note.body);
            const tagString = tags.join(', ');
            await joplin.views.dialogs.showMessageBox(`Suggested tags: ${tagString}\n\nYou can copy these and add them to your note manually.`);
            await copyToClipboard(tagString);
          } catch (error) {
            await joplin.views.dialogs.showMessageBox(`Error: ${error.message}`);
          }
        },
      });

      // 4. Expand Note with ChatGPT
      await joplin.commands.register({
        name: 'expandNoteWithChatGPT',
        label: 'Expand Note with ChatGPT',
        execute: async () => {
          try {
            const note = await getCurrentNote();
            const expandedContent = await chatGPTAPI.expandNote(note.body);
            await updateNoteContent(note.id, expandedContent);
            await joplin.views.dialogs.showMessageBox('Note expanded successfully with ChatGPT!');
          } catch (error) {
            await joplin.views.dialogs.showMessageBox(`Error: ${error.message}`);
          }
        },
      });

      // 5. Fix Grammar with ChatGPT
      await joplin.commands.register({
        name: 'fixGrammarWithChatGPT',
        label: 'Fix Grammar with ChatGPT',
        execute: async () => {
          try {
            const note = await getCurrentNote();
            const correctedContent = await chatGPTAPI.fixGrammar(note.body);
            await updateNoteContent(note.id, correctedContent);
            await joplin.views.dialogs.showMessageBox('Grammar fixed successfully with ChatGPT!');
          } catch (error) {
            await joplin.views.dialogs.showMessageBox(`Error: ${error.message}`);
          }
        },
      });

      // 6. Translate Note with ChatGPT
      await joplin.commands.register({
        name: 'translateNoteWithChatGPT',
        label: 'Translate Note with ChatGPT',
        execute: async () => {
          try {
            const note = await getCurrentNote();
            const translatedContent = await chatGPTAPI.translateNote(note.body);
            await updateNoteContent(note.id, translatedContent);
            await joplin.views.dialogs.showMessageBox('Note translated successfully with ChatGPT!');
          } catch (error) {
            await joplin.views.dialogs.showMessageBox(`Error: ${error.message}`);
          }
        },
      });

      // 7. Improve Selected Text with ChatGPT
      await joplin.commands.register({
        name: 'improveSelectedTextWithChatGPT',
        label: 'Improve Selected Text with ChatGPT',
        execute: async () => {
          try {
            const selectedText = await getSelectedText();
            if (!selectedText || selectedText.trim() === '') {
              throw new Error('No text selected. Please select some text first.');
            }
            const improvedText = await chatGPTAPI.improveNote(selectedText);
            await replaceSelectedText(improvedText);
            await joplin.views.dialogs.showMessageBox('Selected text improved successfully with ChatGPT!');
          } catch (error) {
            await joplin.views.dialogs.showMessageBox(`Error: ${error.message}`);
          }
        },
      });

      // 8. Replace Selected Text with ChatGPT Response
      await joplin.commands.register({
        name: 'replaceSelectedWithChatGPT',
        label: 'Replace Selected Text with ChatGPT Response',
        execute: async () => {
          try {
            const selectedText = await getSelectedText();
            if (!selectedText || selectedText.trim() === '') {
              throw new Error('No text selected. Please select some text first.');
            }
            
            const prompt = await joplin.views.dialogs.showPrompt('Enter your prompt for ChatGPT:', selectedText);
            if (prompt) {
              const response = await chatGPTAPI.sendMessage(prompt, selectedText);
              await replaceSelectedText(response);
              await joplin.views.dialogs.showMessageBox('Selected text replaced successfully with ChatGPT response!');
            }
          } catch (error) {
            await joplin.views.dialogs.showMessageBox(`Error: ${error.message}`);
          }
        },
      });

      // 9. Copy ChatGPT Response to Clipboard
      await joplin.commands.register({
        name: 'copyChatGPTResponse',
        label: 'Copy ChatGPT Response to Clipboard',
        execute: async () => {
          try {
            const prompt = await joplin.views.dialogs.showPrompt('Enter your prompt for ChatGPT:');
            if (prompt) {
              const response = await chatGPTAPI.sendMessage(prompt);
              await copyToClipboard(response);
              await joplin.views.dialogs.showMessageBox('ChatGPT response copied to clipboard!');
            }
          } catch (error) {
            await joplin.views.dialogs.showMessageBox(`Error: ${error.message}`);
          }
        },
      });

      // 10. Use Note as ChatGPT Prompt
      await joplin.commands.register({
        name: 'useNoteAsChatGPTPrompt',
        label: 'Use Note as ChatGPT Prompt',
        execute: async () => {
          try {
            const note = await getCurrentNote();
            const response = await chatGPTAPI.sendMessage(note.body);
            await updateNoteContent(note.id, `# ChatGPT Response\n\n${response}\n\n---\n\n# Original Prompt\n\n${note.body}`);
            await joplin.views.dialogs.showMessageBox('Note used as ChatGPT prompt successfully!');
          } catch (error) {
            await joplin.views.dialogs.showMessageBox(`Error: ${error.message}`);
          }
        },
      });

      console.info('ChatGPT Toolkit commands registered successfully!');

      // ===== CHAT PANEL SETUP =====
      console.info('Setting up ChatGPT chat panel...');

      // Create the chat panel
      const panel = await joplin.views.panels.create('chatgpt-chat-panel');
      
      // Set the panel HTML content
      await joplin.views.panels.setHtml(panel, `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>ChatGPT Chat</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              margin: 0;
              padding: 16px;
              background-color: #f5f5f5;
              height: 100vh;
              display: flex;
              flex-direction: column;
            }
            
            .chat-container {
              flex: 1;
              display: flex;
              flex-direction: column;
              background: white;
              border-radius: 12px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.08);
              overflow: hidden;
              border: 1px solid #e1e5e9;
            }
            
            .chat-header {
              background: linear-gradient(135deg, #007acc 0%, #005a9e 100%);
              color: white;
              padding: 16px 20px;
              font-weight: 600;
              font-size: 15px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            
            .chat-messages {
              flex: 1;
              overflow-y: auto;
              padding: 16px;
              max-height: 400px;
              min-height: 200px;
            }
            
            .message {
              margin-bottom: 16px;
              display: flex;
              flex-direction: column;
            }
            
            .message.user {
              align-items: flex-end;
            }
            
            .message.assistant {
              align-items: flex-start;
            }
            
            .message-content {
              max-width: 85%;
              padding: 14px 18px;
              border-radius: 16px;
              word-wrap: break-word;
              white-space: pre-wrap;
              line-height: 1.5;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            
            .message.user .message-content {
              background: linear-gradient(135deg, #007acc 0%, #005a9e 100%);
              color: white;
            }
            
            .message.assistant .message-content {
              background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
              color: #2c3e50;
              border: 1px solid #e1e5e9;
            }
            
            .chat-input-container {
              padding: 16px;
              border-top: 1px solid #e0e0e0;
              background: white;
              flex-shrink: 0;
            }
            
            .chat-input {
              width: calc(100% - 80px);
              padding: 12px 16px;
              border: 1px solid #ddd;
              border-radius: 12px;
              font-size: 14px;
              outline: none;
              resize: vertical;
              min-height: 120px;
              max-height: 200px;
              overflow-y: auto;
              font-family: inherit;
              line-height: 1.4;
            }
            
            .chat-input:focus {
              border-color: #007acc;
            }
            
            .send-button {
              margin-top: 8px;
              padding: 8px 16px;
              background: linear-gradient(135deg, #007acc 0%, #005a9e 100%);
              color: white;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
              float: right;
              width: 70px;
              height: 40px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              transition: all 0.2s ease;
            }
            
            .send-button:hover {
              background: linear-gradient(135deg, #005a9e 0%, #004080 100%);
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
              transform: translateY(-1px);
            }
            
            .send-button:disabled {
              background: #ccc;
              cursor: not-allowed;
            }
            
            .loading {
              display: none;
              text-align: center;
              padding: 16px;
              color: #666;
            }
            
            .error {
              background: #ffebee;
              color: #c62828;
              padding: 12px;
              border-radius: 8px;
              margin: 8px 0;
            }
            
            .quick-actions {
              padding: 16px;
              background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
              border-top: 1px solid #e0e0e0;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              flex-shrink: 0;
            }
            
            .action-button {
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0;
              padding: 10px 12px;
              background: linear-gradient(135deg, #007acc 0%, #005a9e 100%);
              color: white;
              border-radius: 8px;
              font-size: 11px;
              font-weight: 500;
              cursor: pointer;
              border: none;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              transition: all 0.2s ease;
              text-align: center;
              min-height: 36px;
            }
            
            .action-button:hover {
              background: linear-gradient(135deg, #005a9e 0%, #004080 100%);
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
              transform: translateY(-1px);
            }
            
            .action-button:active {
              transform: translateY(0);
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
          </style>
        </head>
        <body>
          <div class="chat-container">
            <div class="chat-header">
              🤖 ChatGPT Toolkit
            </div>
            
            <div class="quick-actions">
              <button class="action-button" data-action="appendToNote">📝 Append Reply to Note</button>
              <button class="action-button" data-action="replaceNote">🔄 Replace Note with Reply</button>
              <button class="action-button" data-action="createNewNote">📄 Create New Note</button>
              <button class="action-button" data-action="copyNoteToPrompt">📋 Copy Note to Prompt</button>
              <button class="action-button" data-action="copySelectedToPrompt">✂️ Copy Selected to Prompt</button>
              <button class="action-button" data-action="checkGrammar">✅ Check Grammar</button>
            </div>
            
            <div class="chat-messages" id="chatMessages">
              <div class="message assistant">
                <div class="message-content">
Hello! I'm your ChatGPT assistant integrated with Joplin provided by Cogitations. 

You can ask me anything! Type your question or request in the input below, and I'll respond using ChatGPT.

Make sure to set your OpenAI API key in Settings → Plugins → ChatGPT Toolkit.
                </div>
              </div>
            </div>
            
            <div class="loading" id="loading">
              ChatGPT is thinking...
            </div>
            
            <div class="chat-input-container">
              <textarea 
                class="chat-input" 
                id="chatInput" 
                placeholder="Enter your prompt here... (Enter to send, Shift+Enter for new line)"
                rows="5"
              ></textarea>
              <button class="send-button" id="sendButton">Send</button>
            </div>
          </div>
          
        </body>
        </html>
      `);

      // Load external webview script (avoid inline scripts due to CSP)
      await joplin.views.panels.addScript(panel, 'webview.js');

      // Show the panel
      await joplin.views.panels.show(panel);
      
      // Store temp data for webview communication
      let tempData = {};
      
      // Handle action function that can access tempData
      async function handleAction(action) {
        try {
          switch (action) {
            case 'appendToNote':
              if (!lastChatGPTResponse) {
                return { success: false, error: 'No ChatGPT response to append. Send a message first.' };
              }
              const note = await getCurrentNote();
              await updateNoteContent(note.id, note.body + '\n\n---\n\n**ChatGPT Response:**\n' + lastChatGPTResponse);
              return { success: true, message: 'ChatGPT response appended to note successfully!' };
              
            case 'replaceNote':
              if (!lastChatGPTResponse) {
                return { success: false, error: 'No ChatGPT response to replace with. Send a message first.' };
              }
              const noteToReplace = await getCurrentNote();
              await updateNoteContent(noteToReplace.id, lastChatGPTResponse);
              return { success: true, message: 'Note replaced with ChatGPT response successfully!' };
              
            case 'createNewNote':
              if (!lastChatGPTResponse) {
                return { success: false, error: 'No ChatGPT response to create note with. Send a message first.' };
              }
              // Create a new note with the ChatGPT response
              const newNote = await joplin.data.post(['notes'], null, {
                title: 'ChatGPT Response - ' + new Date().toLocaleString(),
                body: lastChatGPTResponse,
                parent_id: await getCurrentFolderId()
              });
              
              // Make the new note active
              await joplin.commands.execute('openNote', newNote.id);
              
              return { success: true, message: 'New note created and opened successfully!' };
              
            case 'copyNoteToPrompt':
              const currentNote = await getCurrentNote();
              // Store the content in temp data for the webview to access
              tempData.noteContentToAppend = currentNote.body;
              console.log('Stored note content for webview:', currentNote.body.substring(0, 100) + '...');
              return { success: true, message: 'Note content appended to prompt input!' };
              
            case 'copySelectedToPrompt':
              const selectedText = await getSelectedText();
              if (!selectedText || selectedText.trim() === '') {
                return { success: false, error: 'No text selected. Please select some text first.' };
              }
              // Store the content in temp data for the webview to access
              tempData.selectedTextToAppend = selectedText;
              console.log('Stored selected text for webview:', selectedText.substring(0, 100) + '...');
              return { success: true, message: 'Selected text appended to prompt input!' };
              
            case 'checkGrammar':
              const textToCheck = await getSelectedText();
              if (!textToCheck || textToCheck.trim() === '') {
                return { success: false, error: 'No text selected. Please select some text first.' };
              }
              
              // Use ChatGPT to check grammar
              const grammarResponse = await chatGPTAPI.checkGrammar(textToCheck);
              
              // Replace the selected text with the corrected version
              await replaceSelectedText(grammarResponse);
              
              return { success: true, message: 'Grammar check completed and text updated!' };
              
            default:
              return { success: false, error: 'Unknown action: ' + action };
          }
        } catch (error) {
          console.error('Error handling action:', error);
          return { success: false, error: error.message };
        }
      }
      
      // Handle messages from the webview
      await joplin.views.panels.onMessage(panel, async (message) => {
          try {
            if (message.type === 'sendChatMessage') {
              const response = await chatGPTAPI.sendMessage(message.message);
              lastChatGPTResponse = response; // Store for later use
              return { success: true, content: response };
            } else if (message.type === 'executeAction') {
              return await handleAction(message.action);
            } else if (message.type === 'getTempData') {
              return tempData;
            } else if (message.type === 'clearTempData') {
              if (message.key) {
                delete tempData[message.key];
              } else {
                tempData = {};
              }
              return { success: true };
            }
          } catch (error) {
            console.error('Error handling webview message:', error);
            return { success: false, error: error.message };
          }
        });
      
      console.info('ChatGPT chat panel created successfully!');
      
      console.info('ChatGPT Toolkit Plugin initialized successfully!');
      console.info('Available commands:');
      console.info('- Improve Note with ChatGPT');
      console.info('- Summarize Note with ChatGPT');
      console.info('- Generate Tags with ChatGPT');
      console.info('- Expand Note with ChatGPT');
      console.info('- Fix Grammar with ChatGPT');
      console.info('- Translate Note with ChatGPT');
      console.info('- Improve Selected Text with ChatGPT');
      console.info('- Replace Selected Text with ChatGPT Response');
      console.info('- Copy ChatGPT Response to Clipboard');
      console.info('- Use Note as ChatGPT Prompt');
      console.info('- ChatGPT Chat Panel (side window)');
      
    } catch (error) {
      console.error('Error initializing ChatGPT plugin:', error);
    }
  },
});
