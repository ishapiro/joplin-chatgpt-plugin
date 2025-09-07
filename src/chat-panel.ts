import joplin from 'api';
import { ChatGPTAPI, ChatMessage } from './chatgpt-api';

const chatGPT = new ChatGPTAPI();

export async function setupChatPanel(): Promise<void> {
  // Create the chat panel
  const panel = await joplin.views.panels.create('chatgpt.panel');
  
  // Set the panel title
  await joplin.views.panels.setTitle(panel, 'ChatGPT Assistant');
  
  // Set the panel HTML content
  await joplin.views.panels.setHtml(panel, `
    <div id="chatgpt-container">
      <div id="chatgpt-header">
        <h3>ChatGPT Assistant</h3>
        <div id="chatgpt-status">Ready</div>
      </div>
      
      <div id="chatgpt-messages"></div>
      
      <div id="chatgpt-input-container">
        <textarea id="chatgpt-input" placeholder="Ask ChatGPT anything..."></textarea>
        <div id="chatgpt-buttons">
          <button id="chatgpt-send">Send</button>
          <button id="chatgpt-clear">Clear</button>
          <button id="chatgpt-context">Use Note Context</button>
        </div>
      </div>
      
      <div id="chatgpt-actions">
        <button id="chatgpt-improve-note">Improve Note</button>
        <button id="chatgpt-generate-tags">Generate Tags</button>
        <button id="chatgpt-summarize">Summarize Note</button>
      </div>
    </div>
    
    <style>
      #chatgpt-container {
        display: flex;
        flex-direction: column;
        height: 100vh;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: var(--joplin-background-color);
        color: var(--joplin-color);
      }
      
      #chatgpt-header {
        padding: 10px;
        border-bottom: 1px solid var(--joplin-divider-color);
        background: var(--joplin-background-color);
      }
      
      #chatgpt-header h3 {
        margin: 0 0 5px 0;
        font-size: 16px;
        font-weight: 600;
      }
      
      #chatgpt-status {
        font-size: 12px;
        color: var(--joplin-color-faded);
      }
      
      #chatgpt-messages {
        flex: 1;
        overflow-y: auto;
        padding: 10px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      
      .message {
        padding: 8px 12px;
        border-radius: 8px;
        max-width: 80%;
        word-wrap: break-word;
      }
      
      .message.user {
        background: var(--joplin-color-accent);
        color: white;
        align-self: flex-end;
        margin-left: auto;
      }
      
      .message.assistant {
        background: var(--joplin-background-color-hover);
        border: 1px solid var(--joplin-divider-color);
        align-self: flex-start;
      }
      
      .message.system {
        background: var(--joplin-color-warning);
        color: white;
        align-self: center;
        font-size: 12px;
        text-align: center;
      }
      
      #chatgpt-input-container {
        padding: 10px;
        border-top: 1px solid var(--joplin-divider-color);
        background: var(--joplin-background-color);
      }
      
      #chatgpt-input {
        width: 100%;
        min-height: 60px;
        padding: 8px;
        border: 1px solid var(--joplin-divider-color);
        border-radius: 4px;
        resize: vertical;
        font-family: inherit;
        font-size: 14px;
        background: var(--joplin-background-color);
        color: var(--joplin-color);
        box-sizing: border-box;
      }
      
      #chatgpt-input:focus {
        outline: none;
        border-color: var(--joplin-color-accent);
      }
      
      #chatgpt-buttons {
        display: flex;
        gap: 8px;
        margin-top: 8px;
      }
      
      #chatgpt-buttons button {
        padding: 6px 12px;
        border: 1px solid var(--joplin-divider-color);
        border-radius: 4px;
        background: var(--joplin-background-color);
        color: var(--joplin-color);
        cursor: pointer;
        font-size: 12px;
        transition: background-color 0.2s;
      }
      
      #chatgpt-buttons button:hover {
        background: var(--joplin-background-color-hover);
      }
      
      #chatgpt-buttons button:active {
        background: var(--joplin-color-accent);
        color: white;
      }
      
      #chatgpt-actions {
        padding: 10px;
        border-top: 1px solid var(--joplin-divider-color);
        background: var(--joplin-background-color);
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      
      #chatgpt-actions button {
        padding: 6px 12px;
        border: 1px solid var(--joplin-divider-color);
        border-radius: 4px;
        background: var(--joplin-background-color);
        color: var(--joplin-color);
        cursor: pointer;
        font-size: 11px;
        transition: background-color 0.2s;
      }
      
      #chatgpt-actions button:hover {
        background: var(--joplin-background-color-hover);
      }
      
      #chatgpt-actions button:active {
        background: var(--joplin-color-accent);
        color: white;
      }
      
      .loading {
        opacity: 0.6;
        pointer-events: none;
      }
      
      .error {
        color: var(--joplin-color-error);
        background: var(--joplin-background-color-error);
        border: 1px solid var(--joplin-color-error);
      }
    </style>
  `);

  // Handle panel messages
  await joplin.views.panels.onMessage(panel, async (message: any) => {
    try {
      switch (message.name) {
        case 'sendMessage':
          await handleSendMessage(panel, message.content);
          break;
        case 'clearChat':
          await clearChat(panel);
          break;
        case 'useNoteContext':
          await useNoteContext(panel);
          break;
        case 'improveNote':
          await improveNote(panel);
          break;
        case 'generateTags':
          await generateTags(panel);
          break;
        case 'summarizeNote':
          await summarizeNote(panel);
          break;
      }
    } catch (error: any) {
      await joplin.views.panels.postMessage(panel, {
        name: 'error',
        content: error.message
      });
    }
  });

  // Add event listeners
  await joplin.views.panels.addScript(panel, `
    let chatHistory = [];
    
    function addMessage(content, type = 'user') {
      const messagesContainer = document.getElementById('chatgpt-messages');
      const messageDiv = document.createElement('div');
      messageDiv.className = 'message ' + type;
      messageDiv.textContent = content;
      messagesContainer.appendChild(messageDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    function setStatus(status) {
      document.getElementById('chatgpt-status').textContent = status;
    }
    
    function setLoading(loading) {
      const container = document.getElementById('chatgpt-container');
      if (loading) {
        container.classList.add('loading');
        setStatus('Processing...');
      } else {
        container.classList.remove('loading');
        setStatus('Ready');
      }
    }
    
    function showError(message) {
      addMessage('Error: ' + message, 'system error');
    }
    
    // Event listeners
    document.getElementById('chatgpt-send').addEventListener('click', () => {
      const input = document.getElementById('chatgpt-input');
      const message = input.value.trim();
      if (message) {
        addMessage(message, 'user');
        chatHistory.push({ role: 'user', content: message });
        webviewApi.postMessage({
          name: 'sendMessage',
          content: message
        });
        input.value = '';
      }
    });
    
    document.getElementById('chatgpt-clear').addEventListener('click', () => {
      webviewApi.postMessage({ name: 'clearChat' });
    });
    
    document.getElementById('chatgpt-context').addEventListener('click', () => {
      webviewApi.postMessage({ name: 'useNoteContext' });
    });
    
    document.getElementById('chatgpt-improve-note').addEventListener('click', () => {
      webviewApi.postMessage({ name: 'improveNote' });
    });
    
    document.getElementById('chatgpt-generate-tags').addEventListener('click', () => {
      webviewApi.postMessage({ name: 'generateTags' });
    });
    
    document.getElementById('chatgpt-summarize').addEventListener('click', () => {
      webviewApi.postMessage({ name: 'summarizeNote' });
    });
    
    // Enter key to send message
    document.getElementById('chatgpt-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        document.getElementById('chatgpt-send').click();
      }
    });
    
    // Handle messages from the plugin
    webviewApi.onMessage((message) => {
      switch (message.name) {
        case 'addMessage':
          addMessage(message.content, message.type);
          if (message.type === 'assistant') {
            chatHistory.push({ role: 'assistant', content: message.content });
          }
          break;
        case 'setLoading':
          setLoading(message.loading);
          break;
        case 'error':
          showError(message.content);
          break;
        case 'clearChat':
          document.getElementById('chatgpt-messages').innerHTML = '';
          chatHistory = [];
          break;
      }
    });
    
    // Initial message
    addMessage('Hello! I\'m your ChatGPT assistant. How can I help you with your notes?', 'assistant');
  `);
}

async function handleSendMessage(panel: string, content: string): Promise<void> {
  await joplin.views.panels.postMessage(panel, { name: 'setLoading', loading: true });
  
  try {
    const response = await chatGPT.sendMessage([
      { role: 'system', content: 'You are a helpful AI assistant integrated with Joplin note-taking app.' },
      { role: 'user', content: content }
    ]);
    
    await joplin.views.panels.postMessage(panel, {
      name: 'addMessage',
      content: response.content,
      type: 'assistant'
    });
  } catch (error: any) {
    await joplin.views.panels.postMessage(panel, {
      name: 'error',
      content: error.message
    });
  } finally {
    await joplin.views.panels.postMessage(panel, { name: 'setLoading', loading: false });
  }
}

async function clearChat(panel: string): Promise<void> {
  await joplin.views.panels.postMessage(panel, { name: 'clearChat' });
}

async function useNoteContext(panel: string): Promise<void> {
  const note = await joplin.workspace.selectedNote();
  if (!note) {
    await joplin.views.panels.postMessage(panel, {
      name: 'error',
      content: 'Please select a note first.'
    });
    return;
  }
  
  await joplin.views.panels.postMessage(panel, {
    name: 'addMessage',
    content: `Using note context: "${note.title}"`,
    type: 'system'
  });
  
  // Store the note context for future messages
  await joplin.views.panels.postMessage(panel, {
    name: 'setNoteContext',
    content: note.body
  });
}

async function improveNote(panel: string): Promise<void> {
  const note = await joplin.workspace.selectedNote();
  if (!note) {
    await joplin.views.panels.postMessage(panel, {
      name: 'error',
      content: 'Please select a note first.'
    });
    return;
  }
  
  await joplin.views.panels.postMessage(panel, { name: 'setLoading', loading: true });
  
  try {
    const improvedContent = await chatGPT.improveNote(note.body);
    await joplin.data.put(['notes', note.id], null, { body: improvedContent });
    
    await joplin.views.panels.postMessage(panel, {
      name: 'addMessage',
      content: 'Note improved successfully! The note has been updated.',
      type: 'system'
    });
  } catch (error: any) {
    await joplin.views.panels.postMessage(panel, {
      name: 'error',
      content: error.message
    });
  } finally {
    await joplin.views.panels.postMessage(panel, { name: 'setLoading', loading: false });
  }
}

async function generateTags(panel: string): Promise<void> {
  const note = await joplin.workspace.selectedNote();
  if (!note) {
    await joplin.views.panels.postMessage(panel, {
      name: 'error',
      content: 'Please select a note first.'
    });
    return;
  }
  
  await joplin.views.panels.postMessage(panel, { name: 'setLoading', loading: true });
  
  try {
    const tags = await chatGPT.generateTags(note.body);
    const tagsString = tags.join(', ');
    
    await joplin.views.panels.postMessage(panel, {
      name: 'addMessage',
      content: `Generated tags: ${tagsString}`,
      type: 'assistant'
    });
  } catch (error: any) {
    await joplin.views.panels.postMessage(panel, {
      name: 'error',
      content: error.message
    });
  } finally {
    await joplin.views.panels.postMessage(panel, { name: 'setLoading', loading: false });
  }
}

async function summarizeNote(panel: string): Promise<void> {
  const note = await joplin.workspace.selectedNote();
  if (!note) {
    await joplin.views.panels.postMessage(panel, {
      name: 'error',
      content: 'Please select a note first.'
    });
    return;
  }
  
  await joplin.views.panels.postMessage(panel, { name: 'setLoading', loading: true });
  
  try {
    const summary = await chatGPT.summarizeNote(note.body);
    
    await joplin.views.panels.postMessage(panel, {
      name: 'addMessage',
      content: `Summary of "${note.title}":\\n\\n${summary}`,
      type: 'assistant'
    });
  } catch (error: any) {
    await joplin.views.panels.postMessage(panel, {
      name: 'error',
      content: error.message
    });
  } finally {
    await joplin.views.panels.postMessage(panel, { name: 'setLoading', loading: false });
  }
}
