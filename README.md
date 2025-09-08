# Joplin ChatGPT Plugin

A comprehensive ChatGPT integration plugin for the Joplin note-taking app that provides AI-powered assistance for note improvement, content generation, and interactive chat functionality.

## Quick Start Guide

### 1. Installation & Setup

1. **Install the Plugin**:
   - Download the plugin file (`joplin-plugin-chatgpt.jpl`)
   - In Joplin, go to **Tools** → **Options** → **Plugins**
   - Click **Install Plugin** and select the downloaded file
   - Enable the plugin when prompted

2. **Configure Your OpenAI API Key**:
   - Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
   - In Joplin, go to **Tools** → **Options** → **Plugins** → **ChatGPT Toolkit**
   - Enter your API key in the **OpenAI API Key** field
   - Click **Apply** to save

3. **Configure Plugin Settings**:
   - **OpenAI Model**: Choose your preferred model (GPT-3.5 Turbo, GPT-4, GPT-4o, etc.)
   - **Max Tokens**: Set response length limit (100-4000 tokens)
   - **System Prompt**: Customize AI behavior (optional)
   - **Enable Conversation History**: Keep chat context between messages (recommended)

### 2. Opening the ChatGPT Panel

**Command Palette (Primary Method)**
1. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
2. Type "Open ChatGPT Panel" or "Toggle ChatGPT Toolbox"
3. Press Enter

*Note: Toolbar buttons and menu items are not supported in all Joplin versions due to API compatibility issues. The Command Palette method works reliably across all versions.*

### 3. Using the ChatGPT Panel

The panel appears on the right side of Joplin with these features:

**Chat Interface**:
- Type your message in the input field
- Press `Enter` or click **Send** to get AI response
- Use `Ctrl+Enter` (or `Cmd+Enter` on Mac) to send quickly

**Action Buttons**:
- **📝 Append Reply to Note**: Add ChatGPT response to current note
- **🔄 Replace Note with Reply**: Replace entire note with ChatGPT response  
- **📄 Create New Note**: Create new note with ChatGPT response
- **📋 Copy Note to Prompt**: Copy current note content to chat input
- **✂️ Copy Selected to Prompt**: Copy selected text to chat input
- **✅ Check Grammar**: Fix grammar and spelling of selected text
- **🗑️ Clear History**: Clear conversation history

**Panel Controls**:
- **✕ Close Button**: Close the panel (shows helpful reopening instructions)
- **Clear History Button**: Reset conversation context

### 4. Settings Explained

| Setting | Description | Recommended Value |
|---------|-------------|-------------------|
| **OpenAI API Key** | Your OpenAI API key for authentication | Required - get from OpenAI |
| **OpenAI Model** | AI model to use for responses | `gpt-4o` (best balance) |
| **Max Tokens** | Maximum response length | `1000` (good for most tasks) |
| **System Prompt** | Instructions for AI behavior | Default works well |
| **Enable Conversation History** | Keep chat context between messages | `true` (recommended) |

### 5. Common Workflows

**Improve a Note**:
1. Open the note you want to improve
2. Open ChatGPT panel (`Ctrl+Shift+P` → "Open ChatGPT Panel")
3. Click **📋 Copy Note to Prompt**
4. Type: "Please improve this note for clarity and structure"
5. Click **Send**
6. Click **🔄 Replace Note with Reply** to apply changes

**Research Assistant**:
1. Open ChatGPT panel
2. Click **📋 Copy Note to Prompt** to include your research notes
3. Ask questions like: "What are the key insights from this research?"
4. Use **📝 Append Reply to Note** to add insights to your note

**Grammar Check**:
1. Select text in your note
2. Open ChatGPT panel
3. Click **✂️ Copy Selected to Prompt**
4. Type: "Please check grammar and spelling"
5. Click **Send**
6. Click **🔄 Replace Note with Reply** to apply corrections

**Create New Content**:
1. Open ChatGPT panel
2. Type your request (e.g., "Write a summary of machine learning basics")
3. Click **Send**
4. Click **📄 Create New Note** to create a new note with the response

### 6. Tips & Best Practices

- **Use conversation history**: Keep it enabled for better context
- **Be specific**: The more specific your prompts, the better the responses
- **Use action buttons**: They make it easy to integrate AI responses into your notes
- **Keyboard shortcuts**: Use `Ctrl+Shift+P` to quickly open the panel
- **Close and reopen**: Use the ✕ button to close, then `Ctrl+Shift+P` to reopen

## Features

### Core Features
- **Interactive Chat Panel**: Side panel with ChatGPT chat interface
- **Secure API Key Storage**: Local encrypted storage of OpenAI API keys
- **Note Improvement**: Enhance existing notes with AI assistance
- **Note as Prompt**: Use note content as context for ChatGPT interactions
- **Content Replacement**: Replace entire notes or selected text with AI output
- **Clipboard Integration**: Copy AI responses to clipboard for easy pasting
- **Real-time Communication**: Efficient plugin-to-webview messaging system

### Additional Features
- **Smart Tagging**: Auto-generate relevant tags based on note content
- **Note Summarization**: Create concise summaries of lengthy notes
- **Contextual Assistance**: Use note context in chat conversations
- **Multiple AI Models**: Support for GPT-3.5, GPT-4, and GPT-4 Turbo
- **Customizable Settings**: Adjust temperature, max tokens, and system prompts

## Installation

1. **Prerequisites**:
   - Node.js (v16 or higher)
   - Joplin desktop app
   - OpenAI API key

2. **Setup Environment** (for development/testing):
   ```bash
   # Copy the example environment file
   cp env.example .env.local
   
   # Edit .env.local and add your OpenAI API key
   # Get your API key from: https://platform.openai.com/api-keys
   ```

3. **Build the Plugin**:
   ```bash
   npm install
   npm run build
   ```

4. **Install in Joplin**:
   - Copy the `dist` folder to your Joplin plugins directory
   - Enable the plugin in Joplin settings

## Configuration

### API Key Setup
1. Get your OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Open Joplin settings → Plugins → ChatGPT Toolkit
3. Enter your API key in the secure field
4. Configure other settings as needed

### Settings Options
- **Model**: Choose between GPT-3.5 Turbo, GPT-4, or GPT-4 Turbo
- **Max Tokens**: Control response length (1-4000 tokens)
- **Temperature**: Adjust creativity vs. consistency (0.0-1.0)
- **System Prompt**: Customize AI behavior and personality

## Usage

### Chat Panel
- Open the ChatGPT side panel from the toolbar
- Type messages to interact with ChatGPT
- Use action buttons for quick operations:
  - **📝 Append Reply to Note**: Add ChatGPT response to current note
  - **🔄 Replace Note with Reply**: Replace entire note with ChatGPT response
  - **📄 Create New Note**: Create new note with ChatGPT response
  - **📋 Copy Note to Prompt**: Copy current note content to chat input
  - **✂️ Copy Selected to Prompt**: Copy selected text to chat input
  - **✅ Check Grammar**: Fix grammar and spelling of selected text

### Commands
Access these commands through the command palette (Ctrl/Cmd + Shift + P):

- **Improve Note with ChatGPT**: Enhance the current note's content
- **Use Note as ChatGPT Prompt**: Send note content as context to ChatGPT
- **Check Grammar with ChatGPT**: Fix grammar and spelling of selected text
- **Copy ChatGPT Response to Clipboard**: Generate content and copy to clipboard
- **ChatGPT Chat Panel (side window)**: Open the interactive chat panel

### Workflow Examples

#### Note Improvement
1. Select a note
2. Use "Improve Note with ChatGPT" command
3. Note content is enhanced for clarity and structure

#### Content Generation
1. Select a note or text
2. Use "Copy Note to Prompt" or "Copy Selected to Prompt" in chat panel
3. Enter your specific request
4. Choose to append, replace, or create new note

#### Research Assistant
1. Open chat panel
2. Use "Copy Note to Prompt" to include current note
3. Ask questions about the note content
4. Get AI-powered insights and suggestions

## Technical Implementation

### Plugin-to-Webview Communication

This plugin demonstrates a robust communication system between the Joplin plugin and its webview panel. Here's how it works:

#### The Challenge
Joplin webviews are sandboxed for security, making direct communication challenging. Initial attempts using polling were inefficient.

#### The Solution: Direct Message Passing

**Plugin Side (TypeScript)**:
```typescript
// Send content directly to webview
await joplin.views.panels.postMessage(panel, {
  type: 'appendToPrompt',
  content: noteContent
});
```

**Webview Side (JavaScript)**:
```javascript
// Handle messages from plugin
webviewApi.onMessage((message) => {
  // Handle message wrapping (Joplin wraps messages in 'message' property)
  const actualMessage = message.message || message;
  
  if (actualMessage && actualMessage.type === 'appendToPrompt') {
    // Append content to prompt field
    const currentContent = chatInput.value.trim();
    const newContent = currentContent ? 
      currentContent + '\n\n' + actualMessage.content : 
      actualMessage.content;
    chatInput.value = newContent;
  }
});
```

#### Key Implementation Details

1. **Message Structure**: Joplin wraps messages in a `message` property, so we handle both `message.type` and `message.message.type`

2. **Error Handling**: Comprehensive try-catch blocks with detailed logging

3. **Type Safety**: Full TypeScript implementation with proper interfaces

4. **Real-time Updates**: No polling - messages are sent immediately when actions occur

### Developer Hints for Future Plugin Development

#### 1. Webview Communication Best Practices

**DO**:
- Use `joplin.views.panels.postMessage()` for plugin-to-webview communication
- Use `webviewApi.postMessage()` for webview-to-plugin communication
- Handle message wrapping: `const actualMessage = message.message || message`
- Use `console.info()` in webview for logging (appears in Joplin logs)
- Implement proper error handling with try-catch blocks

**DON'T**:
- Use polling mechanisms (inefficient and unreliable)
- Use global variables for communication
- Rely on inline event handlers (CSP restrictions)
- Use `console.log()` in webview (may not appear in logs)

#### 2. TypeScript Configuration

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "none",
    "lib": ["ES2020", "DOM"],
    "strict": true,
    "noImplicitAny": true,
    "allowJs": true
  }
}
```

#### 3. Build Process

**package.json scripts**:
```json
{
  "scripts": {
    "build": "npm run clean && npm run generate-manifest && npm run compile-ts && npm run copy-webview && npm run create-jpl",
    "compile-ts": "tsc",
    "copy-webview": "cp src/webview.js dist/"
  }
}
```

#### 4. Debugging Webview Issues

**Accessing Webview Logs**:
1. Go to **Configuration** → **Tools** → **Logs** in Joplin
2. Search for your plugin ID or "chatgpt"
3. Use `console.info()` instead of `console.log()` in webview code

**Common Issues**:
- **CSP Violations**: Move inline scripts to external files
- **Message Not Received**: Check message structure and wrapping
- **Settings Not Appearing**: Ensure settings section is registered
- **API Key Field Issues**: Use correct `SettingItemType` values

#### 5. Settings Configuration

**Correct Setting Types** (Joplin API):
```typescript
import { SettingItemType } from 'api';

await joplin.settings.registerSettings({
  'apiKey': {
    value: '',
    type: SettingItemType.String,  // Not 2
    label: 'API Key',
    public: true,
    section: 'myPlugin'
  },
  'maxTokens': {
    value: 1000,
    type: SettingItemType.Int,     // Not 1
    label: 'Max Tokens',
    public: true,
    section: 'myPlugin'
  },
  'autoSave': {
    value: true,
    type: SettingItemType.Bool,    // Not 3
    label: 'Auto Save',
    public: true,
    section: 'myPlugin'
  }
});
```

## Development

### Project Structure
```
src/
├── index.ts              # Main plugin entry point (TypeScript)
├── webview.js            # Webview script (JavaScript)
└── api.d.ts             # Type definitions

dist/                     # Compiled output
├── index.js             # Compiled TypeScript
├── webview.js           # Copied webview script
└── manifest.json        # Generated manifest

test/
├── setup.ts             # Test configuration
├── mocks/               # Mock implementations
└── *.test.ts           # Test files
```

### Building
```bash
# Install dependencies
npm install

# Build the plugin (TypeScript compilation + webview copy)
npm run build

# Development build (faster, no JPL creation)
npm run dev

# Run tests
npm test
```

### Testing
The plugin includes comprehensive tests:
- **Unit Tests**: Individual function testing
- **Integration Tests**: API interaction testing
- **Mock Testing**: Joplin API mocking for isolated testing

Run tests with:
```bash
# Run all tests
npm test

# Run specific test suites
npx jest test/simple.test.ts
npx jest test/plugin.test.ts
```

## Security

- API keys are stored securely using Joplin's encrypted settings
- No data is sent to external services except OpenAI
- All communications use HTTPS
- User data remains private and is not logged

## Troubleshooting

### Common Issues

1. **API Key Not Working**:
   - Verify API key is correct and active
   - Check OpenAI account has sufficient credits
   - Ensure API key has proper permissions

2. **Plugin Not Loading**:
   - Check Joplin version compatibility
   - Verify plugin files are in correct directory
   - Check Joplin console for error messages

3. **Chat Panel Not Appearing**:
   - Ensure plugin is enabled in settings
   - Try restarting Joplin
   - Check if panel is hidden in view menu

4. **Copy to Prompt Not Working**:
   - Check Joplin logs for communication errors
   - Verify webview script is loaded correctly
   - Ensure message structure is handled properly

### Debug Mode
Enable debug logging in Joplin settings to see detailed plugin information.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

- **Issues**: Report bugs and request features on GitHub
- **Documentation**: Check the wiki for detailed guides
- **Community**: Join the Joplin community forum for discussions

## Implementation Decisions

This section documents the key architectural and implementation decisions made during the development of this plugin, providing insights for future development and maintenance.

### 1. TypeScript Conversion

**Decision**: Convert from JavaScript to TypeScript
**Rationale**: 
- Better type safety and error catching during development
- Improved IDE support with autocomplete and refactoring
- Easier maintenance and debugging
- Better documentation through type definitions

**Implementation**:
- Added comprehensive type definitions for Joplin API
- Created interfaces for plugin settings and API responses
- Implemented strict TypeScript configuration
- Maintained backward compatibility with existing JavaScript webview code

### 2. Plugin-to-Webview Communication Architecture

**Decision**: Direct message passing instead of polling
**Rationale**:
- Polling is inefficient and unreliable
- Direct messaging provides real-time communication
- Better user experience with immediate feedback
- Reduced resource usage

**Implementation**:
```typescript
// Plugin to Webview
await joplin.views.panels.postMessage(panel, {
  type: 'appendToPrompt',
  content: noteContent
});

// Webview to Plugin
await webviewApi.postMessage({
  type: 'sendChatMessage',
  message: userInput
});
```

**Key Challenges Solved**:
- Message wrapping: Joplin wraps messages in `message` property
- Error handling: Comprehensive try-catch blocks
- Type safety: Proper TypeScript interfaces

### 3. OpenAI API Integration Strategy

**Decision**: Dynamic endpoint and parameter selection
**Rationale**:
- Support for both legacy and new OpenAI API endpoints
- Handle different parameter requirements for different models
- Future-proof against API changes
- Maintain compatibility with various GPT models

**Implementation**:
```typescript
// Dynamic endpoint selection
const isResponsesEndpoint = this.settings.openaiModel.includes('o3') || 
                           this.settings.openaiModel.includes('o4-mini');
const endpoint = isResponsesEndpoint ? '/v1/responses' : '/v1/chat/completions';

// Dynamic parameter selection
const requestBody: any = {
  model: this.settings.openaiModel,
  [isResponsesEndpoint ? 'input' : 'messages']: messages,
  ...(this.settings.openaiModel.includes('gpt-5') ? 
    { max_completion_tokens: this.settings.maxTokens } : 
    { max_tokens: this.settings.maxTokens }
  )
};
```

### 4. Conversation History Management

**Decision**: Token-aware history trimming with recent message prioritization
**Rationale**:
- Stay within API token limits
- Maintain conversation context
- Prioritize recent messages for better relevance
- Transparent to user experience

**Implementation**:
```typescript
private trimHistoryToTokenLimit(maxTokens: number): void {
  let totalTokens = 0;
  const trimmedHistory: Array<{role: 'user' | 'assistant', content: string}> = [];
  
  // Iterate backwards to keep most recent messages
  for (let i = this.conversationHistory.length - 1; i >= 0; i--) {
    const message = this.conversationHistory[i];
    const messageTokens = this.estimateTokens(message.content);
    
    if (totalTokens + messageTokens <= maxTokens) {
      trimmedHistory.unshift(message); // Add to beginning
      totalTokens += messageTokens;
    } else {
      break;
    }
  }
  
  this.conversationHistory = trimmedHistory;
}
```

### 5. User Interface Design Decisions

**Decision**: Integrated panel with action buttons instead of separate commands
**Rationale**:
- Better user experience with visual feedback
- Reduced command palette clutter
- Contextual actions within the chat interface
- Easier discovery of features

**Implementation**:
- Side panel with chat interface
- Action buttons for common operations
- Close button with helpful reopening instructions
- Clear history functionality

### 6. Error Handling and Logging Strategy

**Decision**: Comprehensive error handling with detailed logging
**Rationale**:
- Better debugging capabilities
- User-friendly error messages
- API error handling for different scenarios
- Timeout handling for hanging requests

**Implementation**:
```typescript
// API call with timeout and error handling
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

try {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${this.settings.openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
    signal: controller.signal
  });
  
  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`[ChatGPT API] Error response: ${response.status} ${response.statusText}`);
    console.error(`[ChatGPT API] Error response body:`, errorBody);
    throw new Error(`OpenAI API error: ${response.status} - ${errorBody}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
} catch (error: any) {
  if (error.name === 'AbortError') {
    throw new Error('Request timed out. Please try again.');
  }
  throw error;
} finally {
  clearTimeout(timeoutId);
}
```

### 7. Settings Management

**Decision**: Secure settings storage with validation
**Rationale**:
- Protect sensitive API keys
- Validate user input
- Provide sensible defaults
- Support for different model configurations

**Implementation**:
- Encrypted storage through Joplin's settings API
- Input validation for API keys and token limits
- Dynamic model lists based on API capabilities
- Fallback values for all settings

### 8. Build and Deployment Strategy

**Decision**: Source-based development with automated deployment
**Rationale**:
- Edit source files, not compiled output
- Automated build process
- Easy development workflow
- Consistent deployment

**Implementation**:
```json
{
  "scripts": {
    "dev": "npm run generate-manifest && npm run compile-ts && npm run copy-webview && cp -r dist/ ~/Library/Application\\ Support/Joplin/plugins/joplin-plugin-chatgpt/",
    "build": "npm run clean && npm run generate-manifest && npm run compile-ts && npm run copy-webview && npm run create-jpl"
  }
}
```

### 9. Testing Strategy

**Decision**: Comprehensive test coverage with mocking
**Rationale**:
- Ensure reliability
- Test API interactions
- Mock external dependencies
- Validate plugin functionality

**Implementation**:
- Unit tests for individual functions
- Integration tests for API calls
- Mock implementations for Joplin API
- Test coverage for error scenarios

### 10. Security Considerations

**Decision**: Secure API key handling and data privacy
**Rationale**:
- Protect user credentials
- Maintain data privacy
- Follow security best practices
- Transparent data handling

**Implementation**:
- API keys stored in Joplin's encrypted settings
- No data logging or external transmission
- HTTPS-only API communications
- User data remains local

### 11. Performance Optimizations

**Decision**: Efficient resource usage and responsive UI
**Rationale**:
- Minimize plugin impact on Joplin performance
- Provide responsive user experience
- Optimize API calls
- Manage memory usage

**Implementation**:
- Token-aware conversation history
- Efficient message passing
- Minimal DOM manipulation
- Optimized API request handling

### 12. Future-Proofing Decisions

**Decision**: Flexible architecture for API changes
**Rationale**:
- Adapt to OpenAI API evolution
- Support new models as they become available
- Maintain backward compatibility
- Easy feature additions

**Implementation**:
- Dynamic endpoint selection
- Configurable model lists
- Modular API handling
- Extensible message types

## Changelog

### Version 1.0.0
- Initial release with TypeScript implementation
- Chat panel with interactive ChatGPT interface
- Note improvement and content generation
- Secure API key storage
- Comprehensive command set
- Real-time plugin-to-webview communication
- Full test coverage
- Developer documentation and best practices