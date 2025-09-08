// ChatGPT Toolkit Plugin - TypeScript Implementation

// Type definitions for Joplin API
declare const joplin: any;

// Setting types enum
enum SettingItemType {
  Int = 1,
  String = 2,
  Bool = 3
}

// Type definitions for our plugin
interface ChatGPTAPISettings {
  openaiApiKey: string;
  openaiModel: string;
  maxTokens: number;
  systemPrompt: string;
  autoSave: boolean;
}

interface WebviewMessage {
  type: string;
  content?: string;
  sender?: string;
  action?: string;
  message?: string;
}

interface Note {
  id: string;
  title: string;
  body: string;
  parent_id?: string;
}

interface ChatGPTResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model?: string;
}

// ChatGPT API class with proper typing
class ChatGPTAPI {
  private settings: ChatGPTAPISettings;

  constructor() {
    this.settings = {
      openaiApiKey: '',
      openaiModel: 'gpt-4o',
      maxTokens: 1000,
      systemPrompt: 'You are a helpful AI assistant from the ChatGPT Toolkit integrated with Joplin notes. Help users improve their notes, answer questions, and provide writing assistance.',
      autoSave: true
    };
  }

  async loadSettings(): Promise<void> {
    this.settings.openaiApiKey = await joplin.settings.value('openaiApiKey');
    this.settings.openaiModel = await joplin.settings.value('openaiModel');
    this.settings.maxTokens = await joplin.settings.value('maxTokens');
    this.settings.systemPrompt = await joplin.settings.value('systemPrompt');
    this.settings.autoSave = await joplin.settings.value('autoSave');
  }

  async sendMessage(userMessage: string): Promise<string> {
    await this.loadSettings();

    if (!this.settings.openaiApiKey) {
      throw new Error('OpenAI API key is not set. Please configure it in Settings → Plugins → ChatGPT Toolkit.');
    }

    console.info(`[ChatGPT API] Starting request to model: ${this.settings.openaiModel}`);
    console.info(`[ChatGPT API] User message length: ${userMessage.length} characters`);
    console.info(`[ChatGPT API] Max tokens: ${this.settings.maxTokens}`);

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error(`[ChatGPT API] Request timeout after 60 seconds for model: ${this.settings.openaiModel}`);
      controller.abort();
    }, 60000); // 60 second timeout

    try {
      const requestBody = {
        model: this.settings.openaiModel,
        messages: [
          { role: 'system', content: this.settings.systemPrompt + '\n\nPlease format your responses using Markdown syntax for better readability.' },
          { role: 'user', content: userMessage }
        ],
        ...(this.settings.openaiModel.includes('gpt-5') 
          ? { max_completion_tokens: this.settings.maxTokens }
          : { max_tokens: this.settings.maxTokens }
        ),
      };

      console.info(`[ChatGPT API] Request body:`, JSON.stringify(requestBody, null, 2));

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.settings.openaiApiKey}`
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.info(`[ChatGPT API] Response status: ${response.status} ${response.statusText}`);
      console.info(`[ChatGPT API] Response headers:`, {
        'content-type': response.headers.get('content-type'),
        'content-length': response.headers.get('content-length'),
        'x-ratelimit-limit': response.headers.get('x-ratelimit-limit'),
        'x-ratelimit-remaining': response.headers.get('x-ratelimit-remaining')
      });

      if (!response.ok) {
        let errorData: any = {};
        try {
          const errorText = await response.text();
          console.error(`[ChatGPT API] Error response body:`, errorText);
          errorData = JSON.parse(errorText);
        } catch (parseError) {
          console.error(`[ChatGPT API] Failed to parse error response:`, parseError);
        }
        
        const errorMessage = `OpenAI API error: ${response.status} ${response.statusText}. ${errorData.error?.message || errorData.error?.code || 'Unknown error'}`;
        console.error(`[ChatGPT API] Full error:`, errorMessage);
        throw new Error(errorMessage);
      }

      const responseText = await response.text();
      console.info(`[ChatGPT API] Response body length: ${responseText.length} characters`);
      
      let data: ChatGPTResponse;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`[ChatGPT API] Failed to parse response JSON:`, parseError);
        console.error(`[ChatGPT API] Raw response:`, responseText);
        throw new Error('Invalid JSON response from OpenAI API');
      }

      console.info(`[ChatGPT API] Parsed response:`, {
        choices: data.choices?.length || 0,
        usage: data.usage,
        model: data.model
      });

      if (!data.choices || data.choices.length === 0) {
        console.error(`[ChatGPT API] No choices in response:`, data);
        throw new Error('No response choices received from ChatGPT');
      }

      const content = data.choices[0]?.message?.content;
      if (!content) {
        console.error(`[ChatGPT API] No content in first choice:`, data.choices[0]);
        throw new Error('No content in ChatGPT response');
      }

      console.info(`[ChatGPT API] Success! Response length: ${content.length} characters`);
      return content;

    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        console.error(`[ChatGPT API] Request was aborted (timeout) for model: ${this.settings.openaiModel}`);
        throw new Error(`Request timeout after 60 seconds. This may indicate the model '${this.settings.openaiModel}' is not available or experiencing issues.`);
      }
      
      console.error(`[ChatGPT API] Request failed:`, error);
      
      if (error.message.includes('fetch')) {
        throw new Error(`Network error: ${error.message}. Please check your internet connection and try again.`);
      }
      
      throw error;
    }
  }

  async improveNote(noteContent: string): Promise<string> {
    const prompt = `Please improve the following note content by enhancing clarity, structure, and readability while preserving the original meaning and key information:

${noteContent}

Please provide only the improved version without any additional commentary.`;
    
    return await this.sendMessage(prompt);
  }

  async summarizeNote(noteContent: string): Promise<string> {
    const prompt = `Please provide a concise summary of the following note content, highlighting the key points and main ideas:

${noteContent}

Please provide only the summary without any additional commentary.`;
    
    return await this.sendMessage(prompt);
  }

  async checkGrammar(text: string): Promise<string> {
    const prompt = `Please fix any grammar, spelling, and punctuation errors in the following text while preserving the original meaning and style:

${text}

Please provide only the corrected version without any additional commentary.`;
    
    return await this.sendMessage(prompt);
  }
}

// Register the plugin
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
          type: SettingItemType.String,
          label: 'OpenAI API Key',
          description: 'Your OpenAI API key for ChatGPT access. Get one from https://platform.openai.com/api-keys',
          public: true,
          section: 'chatgptToolkit',
        },
        'openaiModel': {
          value: 'gpt-4o',
          type: SettingItemType.String,
          label: 'OpenAI Model',
          description: 'The OpenAI model to use. Supported models: gpt-5, gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo',
          public: true,
          section: 'chatgptToolkit',
        },
        'maxTokens': {
          value: 1000,
          type: SettingItemType.Int,
          label: 'Max Tokens',
          description: 'Maximum number of tokens to generate in responses',
          public: true,
          section: 'chatgptToolkit',
        },
        'systemPrompt': {
          value: 'You are a helpful AI assistant from the ChatGPT Toolkit integrated with Joplin notes. Help users improve their notes, answer questions, and provide writing assistance.',
          type: SettingItemType.String,
          label: 'System Prompt',
          description: 'The system prompt that defines how ChatGPT should behave',
          public: true,
          section: 'chatgptToolkit',
        },
        'autoSave': {
          value: true,
          type: SettingItemType.Bool,
          label: 'Auto-save Changes',
          description: 'Automatically save note changes after AI operations',
          public: true,
          section: 'chatgptToolkit',
        }
      });

      // Create global ChatGPT API instance
      const chatGPTAPI = new ChatGPTAPI();

      // ===== COMMANDS SETUP =====
      console.info('Setting up ChatGPT Toolkit commands...');

      // Helper function to get current note
      async function getCurrentNote(): Promise<Note> {
        const noteIds = await joplin.workspace.selectedNoteIds();
        if (noteIds.length === 0) {
          throw new Error('No note selected. Please select a note first.');
        }
        return await joplin.data.get(['notes', noteIds[0]], { fields: ['id', 'title', 'body'] });
      }

      // Helper function to get current folder ID
      async function getCurrentFolderId(): Promise<string | null> {
        try {
          const noteIds = await joplin.workspace.selectedNoteIds();
          if (noteIds.length > 0) {
            const note = await joplin.data.get(['notes', noteIds[0]], { fields: ['parent_id'] });
            return note.parent_id;
          }
          // If no note selected, use the default folder
          const folders = await joplin.data.get(['folders'], { fields: ['id', 'title'] });
          const inboxFolder = folders.items.find((folder: any) => folder.title === 'Inbox');
          return inboxFolder ? inboxFolder.id : folders.items[0].id;
        } catch (error) {
          console.error('Error getting current folder:', error);
          return null; // Let Joplin use default folder
        }
      }

      // Helper function to update note content
      async function updateNoteContent(noteId: string, newContent: string, autoSave: boolean = true): Promise<void> {
        await joplin.data.put(['notes', noteId], null, { body: newContent });
        if (autoSave) {
          // Note: Joplin auto-saves changes, no manual save command needed
          console.info('Note content updated successfully');
        }
      }

      // Helper function to get selected text from editor
      async function getSelectedText(): Promise<string> {
        try {
          return await joplin.commands.execute('selectedText');
        } catch (error) {
          console.error('Error getting selected text:', error);
          return '';
        }
      }

      // Helper function to replace selected text in editor
      async function replaceSelectedText(newText: string): Promise<void> {
        try {
          await joplin.commands.execute('replaceSelection', newText);
        } catch (error) {
          console.error('Error replacing selected text:', error);
        }
      }

      // Helper function to copy text to clipboard
      async function copyToClipboard(text: string): Promise<void> {
        try {
          await joplin.clipboard.writeText(text);
        } catch (error) {
          console.error('Error copying to clipboard:', error);
        }
      }

      // Helper function to get last ChatGPT response from chat
      let lastChatGPTResponse: string = '';

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
          } catch (error: any) {
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
          } catch (error: any) {
            await joplin.views.dialogs.showMessageBox(`Error: ${error.message}`);
          }
        },
      });

      // 3. Check Grammar with ChatGPT
      await joplin.commands.register({
        name: 'checkGrammarWithChatGPT',
        label: 'Check Grammar with ChatGPT',
        execute: async () => {
          try {
            const selectedText = await getSelectedText();
            if (!selectedText || selectedText.trim() === '') {
              await joplin.views.dialogs.showMessageBox('Please select some text to check grammar.');
              return;
            }
            
            const correctedText = await chatGPTAPI.checkGrammar(selectedText);
            await replaceSelectedText(correctedText);
            await joplin.views.dialogs.showMessageBox('Grammar check completed and text updated!');
          } catch (error: any) {
            await joplin.views.dialogs.showMessageBox(`Error: ${error.message}`);
          }
        },
      });

      // 4. Copy ChatGPT Response to Clipboard
      await joplin.commands.register({
        name: 'copyChatGPTResponseToClipboard',
        label: 'Copy ChatGPT Response to Clipboard',
        execute: async () => {
          try {
            if (!lastChatGPTResponse) {
              await joplin.views.dialogs.showMessageBox('No ChatGPT response available. Send a message first.');
              return;
            }
            await copyToClipboard(lastChatGPTResponse);
            await joplin.views.dialogs.showMessageBox('ChatGPT response copied to clipboard!');
          } catch (error: any) {
            await joplin.views.dialogs.showMessageBox(`Error: ${error.message}`);
          }
        },
      });

      // 5. Use Note as ChatGPT Prompt
      await joplin.commands.register({
        name: 'useNoteAsChatGPTPrompt',
        label: 'Use Note as ChatGPT Prompt',
        execute: async () => {
          try {
            const note = await getCurrentNote();
            const response = await chatGPTAPI.sendMessage(note.body);
            lastChatGPTResponse = response;
            await joplin.views.dialogs.showMessageBox(`ChatGPT Response:\n\n${response}`);
          } catch (error: any) {
            await joplin.views.dialogs.showMessageBox(`Error: ${error.message}`);
          }
        },
      });

      // 6. ChatGPT Chat Panel (side window)
      await joplin.commands.register({
        name: 'openChatGPTChatPanel',
        label: 'ChatGPT Chat Panel (side window)',
        execute: async () => {
          try {
            await joplin.views.panels.show('chatgptChatPanel');
          } catch (error: any) {
            console.error('Error opening chat panel:', error);
          }
        },
      });

      // ===== CHAT PANEL SETUP =====
      console.info('Setting up ChatGPT chat panel...');

      // Create the chat panel
      const panel = await joplin.views.panels.create('chatgptChatPanel');

      // Set the panel HTML
      await joplin.views.panels.setHtml(panel, `
        <div class="chat-container">
          <div class="chat-header">
            <h3>ChatGPT Toolkit</h3>
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
          </div>
          <div class="send-button-container">
            <button class="send-button" id="sendButton">Send</button>
          </div>
        </div>

        <style>
          .chat-container {
            display: flex;
            flex-direction: column;
            height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #fafafa;
            color: #2c2c2c;
          }

          .chat-header {
            background: #f8f8f8;
            padding: 16px 20px;
            border-bottom: 1px solid #e0e0e0;
          }

          .chat-header h3 {
            margin: 0;
            color: #2c2c2c;
            font-size: 18px;
            font-weight: 600;
            letter-spacing: -0.01em;
          }

          .quick-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            padding: 16px;
            background: #f5f5f5;
            border-bottom: 1px solid #e8e8e8;
          }

          .action-button {
            padding: 10px 14px;
            border: 1px solid #4a4a4a;
            border-radius: 6px;
            background: #ffffff;
            color: #2c2c2c;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          }

          .action-button:hover {
            background: #4a4a4a;
            color: #ffffff;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }

          .action-button:active {
            background: #3a3a3a;
            color: #ffffff;
            transform: translateY(1px);
          }

          .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            max-height: 400px;
            min-height: 200px;
            background: #fdfdfd;
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
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 14px;
            line-height: 1.5;
            word-wrap: break-word;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }

          .message.user .message-content {
            background: #4a4a4a;
            color: #ffffff;
          }

          .message.assistant .message-content {
            background: #ffffff;
            color: #2c2c2c;
            border: 1px solid #e8e8e8;
          }

          /* Markdown styling for assistant messages */
          .message.assistant .message-content h1,
          .message.assistant .message-content h2,
          .message.assistant .message-content h3 {
            margin: 8px 0 4px 0;
            font-weight: 600;
            color: #2c2c2c;
          }

          .message.assistant .message-content h1 {
            font-size: 18px;
            border-bottom: 1px solid #e8e8e8;
            padding-bottom: 4px;
          }

          .message.assistant .message-content h2 {
            font-size: 16px;
          }

          .message.assistant .message-content h3 {
            font-size: 14px;
          }

          .message.assistant .message-content strong {
            font-weight: 600;
            color: #1a1a1a;
          }

          .message.assistant .message-content em {
            font-style: italic;
            color: #4a4a4a;
          }

          .message.assistant .message-content code {
            background: #f5f5f5;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 13px;
            color: #d63384;
          }

          .message.assistant .message-content pre {
            background: #f8f8f8;
            border: 1px solid #e8e8e8;
            border-radius: 4px;
            padding: 12px;
            margin: 8px 0;
            overflow-x: auto;
          }

          .message.assistant .message-content pre code {
            background: none;
            padding: 0;
            color: #2c2c2c;
            font-size: 13px;
          }

          .message.assistant .message-content a {
            color: #4a4a4a;
            text-decoration: underline;
          }

          .message.assistant .message-content a:hover {
            color: #2c2c2c;
          }

          .loading {
            display: none;
            padding: 16px 20px;
            text-align: center;
            color: #666666;
            font-style: italic;
            background: #f8f8f8;
            border-top: 1px solid #e8e8e8;
          }

          .loading.show {
            display: block;
          }

          .chat-input-container {
            padding: 16px 20px 12px 20px;
            background: #f5f5f5;
            border-top: 1px solid #e8e8e8;
            box-sizing: border-box;
            overflow: hidden;
          }

          .chat-input {
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            padding: 14px 16px;
            border: 1px solid #4a4a4a;
            border-radius: 8px;
            font-size: 14px;
            font-family: inherit;
            resize: vertical;
            min-height: 80px;
            max-height: 200px;
            background: #ffffff;
            color: #2c2c2c;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          }

          .chat-input:focus {
            outline: none;
            border-color: #4a4a4a;
            box-shadow: 0 0 0 3px rgba(74, 74, 74, 0.1);
          }

          .send-button-container {
            padding: 0 20px 16px 20px;
            background: #f5f5f5;
            display: flex;
            justify-content: flex-end;
          }

          .send-button {
            padding: 12px 28px;
            background: #4a4a4a;
            color: #ffffff;
            border: 1px solid #4a4a4a;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }

          .send-button:hover {
            background: #3a3a3a;
            border-color: #3a3a3a;
            box-shadow: 0 3px 6px rgba(0,0,0,0.15);
            transform: translateY(-1px);
          }

          .send-button:active {
            background: #2a2a2a;
            border-color: #2a2a2a;
            transform: translateY(0);
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          }

          .send-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            background: #cccccc;
            border-color: #cccccc;
            color: #666666;
            transform: none;
            box-shadow: none;
          }

          /* Scrollbar styling */
          .chat-messages::-webkit-scrollbar {
            width: 8px;
          }

          .chat-messages::-webkit-scrollbar-track {
            background: #f5f5f5;
            border-radius: 4px;
          }

          .chat-messages::-webkit-scrollbar-thumb {
            background: #4a4a4a;
            border-radius: 4px;
          }

          .chat-messages::-webkit-scrollbar-thumb:hover {
            background: #3a3a3a;
          }
        </style>
      `);

      // Load external webview script (avoid inline scripts due to CSP)
      await joplin.views.panels.addScript(panel, 'webview.js');

      // Show the panel
      await joplin.views.panels.show(panel);
      
      // Handle action function
      async function handleAction(action: string): Promise<{ success: boolean; message?: string; error?: string }> {
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
              // Send the content directly to the webview
              try {
                console.log('About to send message to webview, panel:', panel);
                const result = await joplin.views.panels.postMessage(panel, {
                  type: 'appendToPrompt',
                  content: currentNote.body
                });
                console.log('PostMessage result:', result);
                console.log('Sent note content to webview:', currentNote.body.substring(0, 100) + '...');
              } catch (error: any) {
                console.error('Error sending message to webview:', error);
              }
              return { success: true, message: 'Note content appended to prompt input!' };
              
            case 'copySelectedToPrompt':
              const selectedText = await getSelectedText();
              if (!selectedText || selectedText.trim() === '') {
                return { success: false, error: 'No text selected. Please select some text first.' };
              }
              // Send the content directly to the webview
              try {
                console.log('About to send selected text to webview, panel:', panel);
                const result = await joplin.views.panels.postMessage(panel, {
                  type: 'appendToPrompt',
                  content: selectedText
                });
                console.log('PostMessage result for selected text:', result);
                console.log('Sent selected text to webview:', selectedText.substring(0, 100) + '...');
              } catch (error: any) {
                console.error('Error sending selected text to webview:', error);
              }
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
        } catch (error: any) {
          console.error('Error handling action:', error);
          return { success: false, error: error.message };
        }
      }
      
      // Handle messages from the webview
      await joplin.views.panels.onMessage(panel, async (message: WebviewMessage) => {
        try {
          if (message.type === 'sendChatMessage') {
            const response = await chatGPTAPI.sendMessage(message.message || '');
            lastChatGPTResponse = response; // Store for later use
            return { success: true, content: response };
          } else if (message.type === 'executeAction') {
            return await handleAction(message.action || '');
          }
          return { success: false, error: 'Unknown message type' };
        } catch (error: any) {
          console.error('Error handling webview message:', error);
          return { success: false, error: error.message };
        }
      });
      
      console.info('ChatGPT chat panel created successfully!');
      
      console.info('ChatGPT Toolkit Plugin initialized successfully!');
      console.info('Available commands:');
      console.info('- Copy ChatGPT Response to Clipboard');
      console.info('- Use Note as ChatGPT Prompt');
      console.info('- ChatGPT Chat Panel (side window)');
      
    } catch (error: any) {
      console.error('Error initializing ChatGPT Toolkit Plugin:', error);
    }
  },
});
