// ChatGPT Toolkit Plugin - TypeScript Implementation

// Type definitions for Joplin API
declare const joplin: any;

// Setting types enumReviewrt
enum SettingItemType {
  Int = 1,
  String = 2,
  Bool = 3
}

// Toolbar button location enum
enum ToolbarButtonLocation {
  NoteToolbar = 1,
  EditorToolbar = 2
}

// Note: MenuItemLocation should be imported from 'api/types' but we'll define it here for now
// In a proper setup, you would import it like: import { MenuItemLocation } from 'api/types';
enum MenuItemLocation {
  Tools = 1,
  File = 2,
  Edit = 3,
  View = 4,
  Note = 5,
  Help = 6
}

// Type definitions for our plugin
interface ChatGPTAPISettings {
  openaiApiKey: string;
  openaiModel: string;
  maxTokens: number;
  systemPrompt: string;
  autoSave: boolean;
  reasoningEffort: string;
  verbosity: string;
}

interface WebviewMessage {
  type: string;
  content?: string;
  sender?: string;
  action?: string;
  message?: string;
  correctedText?: string;
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
  private conversationHistory: Array<{role: 'user' | 'assistant', content: string}> = [];

  constructor() {
    this.settings = {
      openaiApiKey: '',
      openaiModel: 'gpt-4.1',
      maxTokens: 1000,
      systemPrompt: 'You are a helpful AI assistant from the ChatGPT Toolkit integrated with Joplin notes. Help users improve their notes, answer questions, and provide writing assistance.',
      autoSave: true,
      reasoningEffort: 'low',
      verbosity: 'low'
    };
  }

  async loadSettings(): Promise<void> {
    this.settings.openaiApiKey = await joplin.settings.value('openaiApiKey');
    this.settings.openaiModel = await joplin.settings.value('openaiModel');
    this.settings.maxTokens = await joplin.settings.value('maxTokens');
    this.settings.systemPrompt = await joplin.settings.value('systemPrompt');
    this.settings.autoSave = await joplin.settings.value('autoSave');
    this.settings.reasoningEffort = await joplin.settings.value('reasoningEffort');
    this.settings.verbosity = await joplin.settings.value('verbosity');
  }

  clearConversationHistory(): void {
    this.conversationHistory = [];
    console.info(`[ChatGPT API] Conversation history cleared`);
  }

  // Validate API key format
  private validateApiKey(apiKey: string): boolean {
    if (!apiKey || typeof apiKey !== 'string') {
      return false;
    }
    
    // Check for basic OpenAI API key format (sk- or sk-proj- prefix)
    if (!apiKey.startsWith('sk-')) {
      console.warn('API key validation: Key should start with "sk-"');
      return true; // Allow anyway, just warn
    }
    
    // Current API keys are typically 150+ characters
    if (apiKey.length < 20 || apiKey.length > 200) {
      return false;
    }
    
    // Allow letters, numbers, hyphens, underscores, and periods
    // Modern OpenAI API keys follow format: sk-proj-[long alphanumeric string]
    if (!/^sk-[A-Za-z0-9\-_\.]+$/.test(apiKey)) {
      return false;
    }
    
    return true;
  }

  // Estimate token count for a message (rough approximation: 1 token ≈ 4 characters)
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  // Get conversation history limited by token count
  private getLimitedHistory(maxTokens: number): Array<{role: 'user' | 'assistant', content: string}> {
    if (this.conversationHistory.length === 0) {
      return [];
    }

    let totalTokens = 0;
    const limitedHistory: Array<{role: 'user' | 'assistant', content: string}> = [];
    
    // Start from the most recent messages and work backwards
    for (let i = this.conversationHistory.length - 1; i >= 0; i--) {
      const message = this.conversationHistory[i];
      const messageTokens = this.estimateTokens(message.content);
      
      if (totalTokens + messageTokens <= maxTokens) {
        limitedHistory.unshift(message); // Add to beginning to maintain order
        totalTokens += messageTokens;
      } else {
        break; // Stop if adding this message would exceed the limit
      }
    }
    
    console.info(`[ChatGPT API] History limited to ${limitedHistory.length} messages (estimated ${totalTokens} tokens, max ${maxTokens})`);
    return limitedHistory;
  }

  // Trim conversation history to stay within token limits
  private trimHistoryToTokenLimit(maxTokens: number): void {
    if (this.conversationHistory.length === 0) {
      return;
    }

    let totalTokens = 0;
    const trimmedHistory: Array<{role: 'user' | 'assistant', content: string}> = [];
    
    // Start from the most recent messages and work backwards
    for (let i = this.conversationHistory.length - 1; i >= 0; i--) {
      const message = this.conversationHistory[i];
      const messageTokens = this.estimateTokens(message.content);
      
      if (totalTokens + messageTokens <= maxTokens) {
        trimmedHistory.unshift(message); // Add to beginning to maintain order
        totalTokens += messageTokens;
      } else {
        break; // Stop if adding this message would exceed the limit
      }
    }
    
    this.conversationHistory = trimmedHistory;
    console.info(`[ChatGPT API] History trimmed to ${trimmedHistory.length} messages (estimated ${totalTokens} tokens, max ${maxTokens})`);
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
      // Determine the correct endpoint and parameter name based on model type
      const endpoint = (this.settings.openaiModel.startsWith('o3') || this.settings.openaiModel === 'o4-mini') 
        ? 'https://api.openai.com/v1/responses'
        : 'https://api.openai.com/v1/chat/completions';
      
      const isResponsesEndpoint = endpoint.includes('/responses');
      
      // Build messages array with conversation history
      const messages = [
        { role: 'system', content: this.settings.systemPrompt + '\n\nPlease format your responses using Markdown syntax for better readability.' }
      ];
      
      // Add conversation history, but limit to 1/2 of max tokens
      const maxHistoryTokensForRequest = Math.floor(this.settings.maxTokens / 2);
      const recentHistory = this.getLimitedHistory(maxHistoryTokensForRequest);
      messages.push(...recentHistory);
      
      // Add current user message
      messages.push({ role: 'user', content: userMessage });
      
      const requestBody: any = {
        model: this.settings.openaiModel,
        [isResponsesEndpoint ? 'input' : 'messages']: messages,
        ...(this.settings.openaiModel.includes('gpt-5') || this.settings.openaiModel.includes('gpt-4.1') || this.settings.openaiModel.startsWith('o')
          ? { max_completion_tokens: this.settings.maxTokens }
          : { max_tokens: this.settings.maxTokens }
        ),
        stream: false
      };

      // Add new parameters for newer models
      if (this.settings.openaiModel.includes('gpt-5') || this.settings.openaiModel.startsWith('o')) {
        requestBody.reasoning_effort = this.settings.reasoningEffort; // low, medium, high
        requestBody.verbosity = this.settings.verbosity; // low, medium, high
      }

      console.info(`[ChatGPT API] Request body:`, JSON.stringify(requestBody, null, 2));
      console.info(`[ChatGPT API] Using endpoint: ${endpoint}`);

      const response = await fetch(endpoint, {
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

      // Handle non-streaming response
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
      
      // Store the conversation exchange in history
      this.conversationHistory.push({ role: 'user', content: userMessage });
      this.conversationHistory.push({ role: 'assistant', content: content });
      
      // Trim history to stay within token limits (keep it under 1/2 of max tokens)
      const maxHistoryTokensForStorage = Math.floor(this.settings.maxTokens / 2);
      this.trimHistoryToTokenLimit(maxHistoryTokensForStorage);
      
      console.info(`[ChatGPT API] Conversation history now has ${this.conversationHistory.length} messages`);
      
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
          value: 'gpt-4.1',
          type: SettingItemType.String,
          label: 'OpenAI Model',
          description: 'The OpenAI model to use. Supported models: GPT-5 family (gpt-5, gpt-5-mini, gpt-5-nano), GPT-4.1 family (gpt-4.1, gpt-4.1-mini, gpt-4.1-nano), GPT-4o family (gpt-4o, gpt-4o-mini), Reasoning models (o1, o3, o4-mini)',
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
        },
        'reasoningEffort': {
          value: 'low',
          type: SettingItemType.String,
          label: 'Reasoning Effort',
          description: 'Controls depth of reasoning for GPT-5 and o-series models (low, medium, high)',
          public: true,
          section: 'chatgptToolkit',
        },
        'verbosity': {
          value: 'low',
          type: SettingItemType.String,
          label: 'Verbosity',
          description: 'Controls response detail level for GPT-5 and o-series models (low, medium, high)',
          public: true,
          section: 'chatgptToolkit',
        },
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

      // ===== CHAT PANEL SETUP =====
      console.info('Setting up ChatGPT chat panel...');

      // Create the chat panel first
      const panelId = 'chatgpt.toolbox.panel';
      const panel = await joplin.views.panels.create(panelId);
      console.info('Panel created with ID:', panel, 'panelId:', panelId);
      
      // Use the actual panel ID that Joplin created
      const actualPanelId = panel;

      // Set the panel HTML
      await joplin.views.panels.setHtml(panel, `
        <div class="chat-container">
          <div class="chat-header">
            <h3>ChatGPT Toolkit</h3>
            <button class="close-button" id="closePanelButton" title="Close Panel">✕</button>
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
            <button class="clear-history-button" id="clearHistoryButton">Clear History</button>
            <button class="send-button" id="sendButton">Send</button>
          </div>
        </div>

        <!-- Grammar Check Modal -->
        <div id="grammar-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000;">
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 8px; max-width: 80%; max-height: 80%; overflow-y: auto;">
            <h3 style="margin-top: 0; color: #2c2c2c;">Grammar Check Results</h3>
            <div style="margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 4px; border-left: 4px solid #28a745;">
              <strong>Corrected Text:</strong>
              <div id="corrected-text" style="margin-top: 10px; white-space: pre-wrap; color: #2c2c2c;"></div>
            </div>
            <div style="margin-top: 20px; text-align: right;">
              <button id="reject-grammar" style="margin-right: 10px; padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Reject</button>
              <button id="accept-grammar" style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">Accept & Apply</button>
            </div>
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
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .chat-header h3 {
            margin: 0;
            color: #2c2c2c;
            font-size: 18px;
            font-weight: 600;
            letter-spacing: -0.01em;
          }

          .close-button {
            background: transparent;
            color: #666666;
            border: none;
            font-size: 18px;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 4px;
            transition: all 0.2s ease;
          }

          .close-button:hover {
            background: rgba(0, 0, 0, 0.1);
            color: #333333;
          }

          .close-button:active {
            background: rgba(0, 0, 0, 0.2);
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

          .message-header {
            display: flex;
            justify-content: flex-end;
            padding: 8px 12px 4px 12px;
            border-bottom: 1px solid #e0e0e0;
          }

          .copy-button {
            padding: 4px 8px;
            background: #ffffff;
            color: #666666;
            border: 1px solid #cccccc;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          }

          .copy-button:hover {
            background: #f8f8f8;
            border-color: #999999;
            color: #333333;
            box-shadow: 0 2px 4px rgba(0,0,0,0.15);
          }

          .copy-button:active {
            background: #eeeeee;
            border-color: #888888;
            transform: translateY(1px);
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
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
            justify-content: space-between;
            align-items: center;
            gap: 12px;
          }

          .clear-history-button {
            padding: 8px 16px;
            background: #ffffff;
            color: #666666;
            border: 1px solid #cccccc;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          }

          .clear-history-button:hover {
            background: #f8f8f8;
            border-color: #999999;
            color: #333333;
            box-shadow: 0 2px 4px rgba(0,0,0,0.15);
            transform: translateY(-1px);
          }

          .clear-history-button:active {
            background: #eeeeee;
            border-color: #888888;
            transform: translateY(0);
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
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
              
              // Show working message
              await joplin.views.panels.postMessage(panel, {
                type: 'addMessage',
                sender: 'system',
                content: 'Checking grammar...'
              });
              
              // Use ChatGPT to check grammar
              const grammarResponse = await chatGPTAPI.checkGrammar(textToCheck);
              
              // Show modal with corrected text for user approval
              await joplin.views.panels.postMessage(panel, {
                type: 'showGrammarModal',
                originalText: textToCheck,
                correctedText: grammarResponse
              });
              
              return { success: true, message: 'Grammar check completed! Please review the changes.' };
              
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
          } else if (message.type === 'clearHistory') {
            chatGPTAPI.clearConversationHistory();
            return { success: true, message: 'Conversation history cleared' };
          } else if (message.type === 'closePanel') {
            // Send a nicely formatted close message to the panel before closing
            await joplin.views.panels.postMessage(actualPanelId, {
              type: 'showCloseMessage'
            });
            return { success: true, message: 'Close message sent' };
          } else if (message.type === 'confirmClose') {
            // Actually close the panel after user confirms
            await joplin.views.panels.hide(actualPanelId);
            return { success: true, message: 'Panel closed' };
          } else if (message.type === 'acceptGrammarChanges') {
            // Replace the selected text with the corrected version
            if (message.correctedText) {
              await replaceSelectedText(message.correctedText);
              
              // Send confirmation message to the panel
              await joplin.views.panels.postMessage(panel, {
                type: 'addMessage',
                sender: 'system',
                content: 'Grammar corrections applied successfully!'
              });
              
              return { success: true, message: 'Grammar changes applied' };
            } else {
              return { success: false, error: 'No corrected text provided' };
            }
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

      // ===== ADDITIONAL COMMANDS SETUP =====
      console.info('Setting up additional ChatGPT commands...');

      // 6. Open ChatGPT Panel
      await joplin.commands.register({
        name: 'openChatGPTPanel',
        label: 'Open ChatGPT Panel',
        execute: async () => {
          try {
            await joplin.views.panels.show(actualPanelId);
            console.info('ChatGPT panel opened via command');
          } catch (error: any) {
            console.error('Error opening chat panel:', error);
          }
        },
      });

      // 7. Toggle ChatGPT Toolbox
      await joplin.commands.register({
        name: 'toggleChatGPTToolbox',
        label: 'Toggle ChatGPT Toolbox',
        execute: async () => {
          try {
            console.info('Toggle command executed, checking panel visibility...');
            const isVisible = await joplin.views.panels.visible(actualPanelId);
            console.info('Panel visibility check result:', isVisible, 'for panel:', actualPanelId);
            
            if (isVisible) {
              console.info('Panel is visible, hiding it...');
              await joplin.views.panels.hide(actualPanelId);
              console.info('ChatGPT Toolbox hidden successfully');
            } else {
              console.info('Panel is not visible, showing it...');
              await joplin.views.panels.show(actualPanelId);
              console.info('ChatGPT Toolbox shown successfully');
            }
          } catch (error: any) {
            console.error('Error toggling ChatGPT toolbox:', error);
            await joplin.views.dialogs.showMessageBox('Error toggling ChatGPT toolbox: ' + error.message);
          }
        },
      });

      // ===== UI ACCESS SETUP =====
      // Note: Toolbar buttons and menu items have compatibility issues with this Joplin version
      // Users can access the ChatGPT panel via the Command Palette, which works reliably
      console.info('ChatGPT Toolkit Access Methods:');
      console.info('1. Command Palette: Ctrl+Shift+P (or Cmd+Shift+P) -> "Open ChatGPT Panel"');
      console.info('2. Command Palette: Ctrl+Shift+P (or Cmd+Shift+P) -> "Toggle ChatGPT Toolbox"');
      console.info('UI elements (toolbar buttons/menu items) disabled due to Joplin version compatibility');
      
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
