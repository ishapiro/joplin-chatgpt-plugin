# Joplin ChatGPT Plugin

A comprehensive ChatGPT integration plugin for the Joplin note-taking app that provides AI-powered assistance for note improvement, content generation, and interactive chat functionality.

## Features

- **Interactive Chat Panel**: Side panel with ChatGPT chat interface
- **Model Selection**: Dropdown selector to choose from available OpenAI models (fetched from API)
- **Note Integration**: Use note content as context for AI interactions
- **Content Actions**: Append, replace, insert at cursor, or create new notes with AI responses
- **Grammar Checking**: Fix grammar and spelling of selected text
- **Secure Storage**: Local encrypted storage of OpenAI API keys
- **Multiple Models**: Support for GPT-5.1, GPT-5, GPT-4.1, GPT-4o, GPT-4, GPT-3.5, and reasoning models (o1, o3, o4-mini)
- **Conversation History**: Maintain context between chat messages
- **Menu Integration**: Access via Tools menu or Command Palette

## Installation

### For Users

1. **Download the Plugin**:
   - Get the plugin file (`joplin-plugin-chatgpt.jpl`) from the releases

2. **Install in Joplin**:
   - Open Joplin → **Tools** → **Options** → **Plugins**
   - Click **Install Plugin** and select the downloaded file
   - Enable the plugin when prompted

3. **Configure API Key**:
   - Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
   - In Joplin: **Tools** → **Options** → **Plugins** → **ChatGPT Toolkit**
   - Enter your API key and configure settings
   - Click **Apply** to save

### For Developers

📖 **For detailed technical information**, see [README-TECH.md](README-TECH.md) which covers architecture decisions, implementation patterns, and serves as a comprehensive tutorial for Joplin plugin development.

1. **Prerequisites**:
   - Node.js (v16 or higher)
   - Joplin desktop app
   - OpenAI API key

2. **Setup**:
   ```bash
   # Clone and install dependencies
   git clone <repository-url>
   cd joplin-chatgpt-plugin
   npm install
   
   # Copy environment file and add your API key
   cp env.example .env.local
   # Edit .env.local with your OpenAI API key
   ```

3. **Build and Deploy**:
   ```bash
   # Recommended: Build and deploy to Joplin
   npm run deploy
   
   # Or create distributable .jpl file
   npm run dist
   ```
   
   **Important**: After deploying, reload the plugin in Joplin:
   - Go to **Tools** → **Options** → **Plugins**
   - Find "ChatGPT Toolkit"
   - Click **Disable**, then **Enable** again

   **Note for Windows Users**: The `deploy` script uses macOS/Linux paths. After `npm run build`, manually copy files from `dist/` to `%APPDATA%\Joplin\plugins\com.cogitations.chatgpt-toolkit\`. See [README-TECH.md](README-TECH.md) for detailed platform-specific instructions.

## Usage

### Opening the ChatGPT Panel

**Multiple Access Methods**:
1. **Tools Menu**: Go to **Tools** → **ChatGPT Toolkit** (if supported in your Joplin version)
2. **Command Palette** (Recommended):
   - Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
   - Type "Open ChatGPT Panel" or "Toggle ChatGPT Toolbox"
   - Press Enter
3. **Keyboard Shortcut**: `Ctrl+Shift+C` / `Cmd+Shift+C` (if menu item is available)

*Note: The Command Palette method works reliably across all Joplin versions.*

### Using the Chat Panel

The panel appears on the right side of Joplin with these features:

**Chat Interface**:
- Type your message in the input field
- Press `Enter` or click **Send** to get AI response
- Use `Ctrl+Enter` (or `Cmd+Enter` on Mac) to send quickly

**Model Selector**:
- Dropdown at the top of the panel to select which OpenAI model to use
- Automatically fetches available models from your OpenAI API account (first time only)
- Defaults to GPT-5.1 (latest model)
- Changes take effect immediately for new conversations

**Action Buttons**:
- **📝 Append**: Add ChatGPT response to the end of current note
- **🔄 Replace**: Replace entire note with ChatGPT response  
- **📍 Insert**: Insert ChatGPT response at cursor position in note
- **📄 New Note**: Create new note with ChatGPT response
- **📋 Note→Prompt**: Copy current note content to chat input
- **✂️ Selected→Prompt**: Copy selected text to chat input
- **✅ Grammar**: Fix grammar and spelling of selected text
- **ℹ️ Help**: View comprehensive help and feature information

### Settings Configuration

| Setting | Description | Recommended Value |
|---------|-------------|-------------------|
| **OpenAI API Key** | Your OpenAI API key for authentication | Required - get from OpenAI |
| **OpenAI Model** | AI model to use for responses | `gpt-5.1` (default, latest) |
| **Max Tokens** | Maximum response length | `1000` (good for most tasks) |
| **System Prompt** | Instructions for AI behavior | Default works well |
| **Enable Conversation History** | Keep chat context between messages | `true` (recommended) |

**Note**: The model selector in the panel UI overrides the settings value. Models are automatically fetched from your OpenAI API account on first plugin load.

### Common Workflows

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
3. Click **✅ Grammar** button
4. Review the corrected text in the modal
5. Click **Apply** to replace the selected text with corrections

**Create New Content**:
1. Open ChatGPT panel
2. Type your request (e.g., "Write a summary of machine learning basics")
3. Click **Send**
4. Click **📄 Create New Note** to create a new note with the response

### Tips & Best Practices

- **Use conversation history**: Keep it enabled for better context
- **Be specific**: The more specific your prompts, the better the responses
- **Use action buttons**: They make it easy to integrate AI responses into your notes
- **Keyboard shortcuts**: Use `Ctrl+Shift+P` to quickly open the panel
- **Close and reopen**: Use the ✕ button to close, then `Ctrl+Shift+P` to reopen

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

# Recommended: Build and deploy to Joplin (cleans, builds, deploys)
npm run deploy

# Alternative: Build only (doesn't deploy to Joplin)
npm run build

# Run tests
npm test
```

**Note**: Use `npm run deploy` for development. It cleans old files, builds fresh, and deploys to Joplin automatically. The `dev` command doesn't clean, which can cause issues with stale code.

### Plugin File Locations

Joplin looks for plugins in specific directories:

**macOS/Linux:**
- `~/.config/joplin-desktop/plugins/com.cogitations.chatgpt-toolkit/`

**Windows:**
- `%APPDATA%\Joplin\plugins\com.cogitations.chatgpt-toolkit\`
- Full path: `C:\Users\YourUsername\AppData\Roaming\Joplin\plugins\com.cogitations.chatgpt-toolkit\`

The `deploy` script automatically copies files to the macOS/Linux location. For Windows, see the [Technical Documentation](README-TECH.md) for manual deployment instructions or how to modify the scripts for cross-platform support.

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

### Building the .jpl Install File

To create a distributable `.jpl` plugin file:

```bash
npm run dist
```

This creates `dist/chatgpt-toolkit-1.0.jpl` ready for installation in Joplin.

**Important**: Joplin plugin files (`.jpl`) must be **TAR archives**, not ZIP files. Using ZIP will cause an "invalid base256 encoding" error during installation.

#### Manual Build (Advanced)
If you need to create the `.jpl` manually:

```bash
# After running your build process to populate ./dist
mkdir -p publish

# Create TAR archive (NOT zip!)
tar --format=ustar -cf publish/chatgpt-toolkit-1.0.jpl -C dist .

# Verify it worked
file publish/chatgpt-toolkit-1.0.jpl  # Should say "tar archive"
tar -tf publish/chatgpt-toolkit-1.0.jpl | head -5
```

#### Troubleshooting

**"invalid base256 encoding" error:**
- Your `.jpl` is a ZIP file instead of TAR
- Solution: Use `npm run dist` or manual TAR command above

**Plugin won't load:**
- Check that `manifest.json` is at the archive root
- Verify all required files are included: `index.js`, `webview.js`, `manifest.json`

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

## Security

- API keys are stored securely using Joplin's encrypted settings
- No data is sent to external services except OpenAI
- All communications use HTTPS
- User data remains private and is not logged

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