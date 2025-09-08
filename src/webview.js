// ChatGPT Toolkit webview script - Real ChatGPT integration
(() => {
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const sendButton = document.getElementById('sendButton');
  const loading = document.getElementById('loading');

  // Simple markdown parser for basic formatting
  function parseMarkdown(text) {
    return text
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      // Inline code
      .replace(/`(.*?)`/g, '<code>$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
      // Line breaks
      .replace(/\n/g, '<br>');
  }

  if (!chatMessages || !chatInput || !sendButton || !loading) {
    console.error('ChatGPT webview: required elements missing');
    return;
  }

  // Bind action buttons
  document.querySelectorAll('.action-button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-action') || '';
      if (action) {
        executeAction(action);
      }
    });
  });

  // Auto-resize textarea
  chatInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 200) + 'px';
  });

  // Enter to send (Shift+Enter for newline, Cmd/Ctrl+Enter to send)
  chatInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      // Check for Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux)
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault();
        sendMessage();
      }
      // Regular Enter to send (unless Shift is held for newline)
      else if (!e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
      // Shift+Enter allows newline (default behavior)
    }
  });

  // Click to send
  sendButton.addEventListener('click', () => sendMessage());

  // Clear history button
  const clearHistoryButton = document.getElementById('clearHistoryButton');
  if (clearHistoryButton) {
    clearHistoryButton.addEventListener('click', async () => {
      try {
        // Clear the conversation history on the backend
        await webviewApi.postMessage({
          type: 'clearHistory'
        });
        
        // Clear the chat window visually
        clearChatWindow();
        
        console.log('History cleared successfully');
      } catch (error) {
        console.error('Error clearing history:', error);
        addError('Error clearing history: ' + error.message);
      }
    });
  }

  function addMessage(sender, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ' + sender;
    
    // Create message header with copy button for assistant messages
    if (sender === 'assistant') {
      const messageHeader = document.createElement('div');
      messageHeader.className = 'message-header';
      
      const copyButton = document.createElement('button');
      copyButton.className = 'copy-button';
      copyButton.innerHTML = '📋 Copy';
      copyButton.title = 'Copy response to clipboard';
      
      copyButton.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(content);
          copyButton.innerHTML = '✅ Copied!';
          copyButton.style.background = '#4CAF50';
          setTimeout(() => {
            copyButton.innerHTML = '📋 Copy';
            copyButton.style.background = '';
          }, 2000);
        } catch (error) {
          console.error('Failed to copy:', error);
          copyButton.innerHTML = '❌ Failed';
          copyButton.style.background = '#f44336';
          setTimeout(() => {
            copyButton.innerHTML = '📋 Copy';
            copyButton.style.background = '';
          }, 2000);
        }
      });
      
      messageHeader.appendChild(copyButton);
      messageDiv.appendChild(messageHeader);
    }
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // Render markdown for assistant messages, plain text for user messages
    if (sender === 'assistant') {
      contentDiv.innerHTML = parseMarkdown(content);
    } else {
      contentDiv.textContent = content;
    }
    
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function addError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    chatMessages.appendChild(errorDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function showLoading(show) {
    loading.style.display = show ? 'block' : 'none';
    if (show) chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function clearChatWindow() {
    // Clear all messages from the chat window
    chatMessages.innerHTML = '';
    
    // Add a welcome message to indicate the chat is cleared
    addMessage('system', 'Chat history cleared. Start a new conversation!');
  }

  async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    addMessage('user', message);
    chatInput.value = '';
    chatInput.style.height = 'auto';

    showLoading(true);
    sendButton.disabled = true;

    try {
      // Send message to ChatGPT via plugin using webviewApi
      const response = await webviewApi.postMessage({
        type: 'sendChatMessage',
        message: message
      });

      if (response && response.success) {
        addMessage('assistant', response.content);
      } else {
        addError('Error: ' + (response?.error || 'Failed to get response from ChatGPT'));
      }
    } catch (error) {
      addError('Error: ' + (error && error.message ? error.message : String(error)));
    } finally {
      showLoading(false);
      sendButton.disabled = false;
      chatInput.focus();
    }
  }

  async function executeAction(action) {
    try {
      const response = await webviewApi.postMessage({
        type: 'executeAction',
        action: action
      });

      if (response && response.success) {
        if (response.message) {
          addMessage('system', response.message);
        }
      } else {
        addError('Error: ' + (response?.error || 'Action failed'));
      }
    } catch (error) {
      addError('Error: ' + (error && error.message ? error.message : String(error)));
    }
  }


  // Handle messages from the plugin
  webviewApi.onMessage((message) => {
    console.info('Webview received message:', message);
    
    // Handle the case where message is wrapped in a 'message' property
    const actualMessage = message.message || message;
    
    if (actualMessage && actualMessage.type) {
      switch (actualMessage.type) {
        case 'setPrompt':
          console.info('Setting prompt to:', actualMessage.content);
          chatInput.value = actualMessage.content;
          chatInput.style.height = 'auto';
          chatInput.style.height = Math.min(chatInput.scrollHeight, 200) + 'px';
          chatInput.focus();
          break;
        case 'appendToPrompt':
          console.info('Appending to prompt:', actualMessage.content);
          // Append content to existing prompt with a line break
          const currentContent = chatInput.value.trim();
          const newContent = currentContent ? 
            currentContent + '\n\n' + actualMessage.content : 
            actualMessage.content;
          console.info('New prompt content:', newContent);
          chatInput.value = newContent;
          chatInput.style.height = 'auto';
          chatInput.style.height = Math.min(chatInput.scrollHeight, 200) + 'px';
          chatInput.focus();
          break;
        case 'addMessage':
          addMessage(actualMessage.sender, actualMessage.content);
          break;
        default:
          console.info('Unknown message type:', actualMessage.type);
      }
    } else {
      console.info('Message received but no type:', actualMessage);
    }
  });
})();