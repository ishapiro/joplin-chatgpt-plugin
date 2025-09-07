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

2. **Build the Plugin**:
   ```bash
   npm install
   npm run build
   ```

3. **Install in Joplin**:
   - Copy the `dist` folder to your Joplin plugins directory
   - Enable the plugin in Joplin settings

## Configuration

### API Key Setup
1. Get your OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Open Joplin settings → Plugins → ChatGPT Integration
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
- Use "Use Note Context" to include current note in conversation
- Access quick actions for note improvement

### Commands
Access these commands through the command palette (Ctrl/Cmd + Shift + P):

- **Improve Note with ChatGPT**: Enhance the current note's content
- **Use Note as ChatGPT Prompt**: Send note content as context to ChatGPT
- **Replace Note with ChatGPT Output**: Replace entire note with AI response
- **Replace Selection with ChatGPT Output**: Replace selected text only
- **Copy ChatGPT Output to Clipboard**: Generate content and copy to clipboard
- **Generate Tags with ChatGPT**: Auto-generate relevant tags
- **Summarize Note with ChatGPT**: Create a summary of the current note

### Workflow Examples

#### Note Improvement
1. Select a note
2. Use "Improve Note with ChatGPT" command
3. Note content is enhanced for clarity and structure

#### Content Generation
1. Select a note or text
2. Use "Use Note as ChatGPT Prompt" command
3. Enter your specific request
4. Choose to copy, replace, or create new note

#### Research Assistant
1. Open chat panel
2. Use "Use Note Context" to include current note
3. Ask questions about the note content
4. Get AI-powered insights and suggestions

## Additional Integration Recommendations

### Smart Note Organization
- **Auto-categorization**: Use AI to suggest note categories
- **Related Note Discovery**: Find connections between notes
- **Content Gap Analysis**: Identify missing information in note collections

### Writing Enhancement
- **Style Consistency**: Maintain consistent writing style across notes
- **Grammar and Proofreading**: Advanced grammar checking and suggestions
- **Tone Adjustment**: Modify note tone for different audiences

### Research and Learning
- **Fact Verification**: Cross-reference information with AI
- **Concept Explanation**: Get detailed explanations of complex topics
- **Learning Paths**: Generate study guides from note collections

### Productivity Features
- **Meeting Notes**: Auto-generate action items and summaries
- **Template Creation**: Generate note templates from examples
- **Content Migration**: Help migrate content between different formats

## Development

### Project Structure
```
src/
├── index.ts              # Main plugin entry point
├── settings.ts           # Settings management
├── chatgpt-api.ts        # ChatGPT API integration
├── commands.ts           # Command definitions
└── chat-panel.ts         # Side panel implementation

test/
├── setup.ts              # Test configuration
├── mocks/                # Mock implementations
└── *.test.ts            # Test files
```

### Building
```bash
# Install dependencies
npm install

# Build the plugin
npm run build

# Watch for changes
npm run watch

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Testing
The plugin includes comprehensive tests:
- **Unit Tests**: Individual function testing
- **Integration Tests**: API interaction testing
- **Mock Testing**: Joplin API mocking for isolated testing

Run tests with:
```bash
npm test
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
- Initial release
- Chat panel with interactive ChatGPT interface
- Note improvement and content generation
- Secure API key storage
- Comprehensive command set
- Smart tagging and summarization
- Full test coverage
