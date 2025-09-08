// ChatGPT Toolkit webview script - Real ChatGPT integration
(() => {
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const sendButton = document.getElementById('sendButton');
  const loading = document.getElementById('loading');

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

  function addMessage(sender, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ' + sender;
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;
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