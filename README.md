# Joplin ChatGPT Plugin

A comprehensive ChatGPT integration plugin for the Joplin note-taking app that provides AI-powered assistance for note improvement, content generation, and interactive chat functionality.

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