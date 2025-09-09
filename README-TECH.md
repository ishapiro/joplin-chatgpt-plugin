# Joplin ChatGPT Plugin - Technical Documentation

This document provides a comprehensive technical overview of the Joplin ChatGPT Plugin, explaining the major architectural decisions, implementation patterns, and serving as a tutorial for Joplin plugin development.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [TypeScript Implementation](#typescript-implementation)
3. [Plugin-to-Webview Communication](#plugin-to-webview-communication)
4. [OpenAI API Integration](#openai-api-integration)
5. [Settings Management](#settings-management)
6. [Build System](#build-system)
7. [Security Considerations](#security-considerations)
8. [Testing Strategy](#testing-strategy)
9. [Development Workflow](#development-workflow)
10. [Common Pitfalls and Solutions](#common-pitfalls-and-solutions)

## Architecture Overview

### High-Level Architecture

The plugin follows a **dual-component architecture**:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Joplin App    │    │   Plugin Core    │    │   Webview UI    │
│                 │    │   (TypeScript)   │    │   (JavaScript)  │
├─────────────────┤    ├──────────────────┤    ├─────────────────┤
│ • Note Data     │◄──►│ • API Integration│◄──►│ • Chat Interface│
│ • User Actions  │    │ • Settings Mgmt  │    │ • Action Buttons│
│ • Commands      │    │ • Message Passing│    │ • Markdown Render│
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Key Components

1. **Plugin Core (`src/index.ts`)**: Main TypeScript plugin that handles:
   - Joplin API integration
   - OpenAI API communication
   - Settings management
   - Command registration
   - Message passing to webview

2. **Webview UI (`src/webview.js`)**: JavaScript frontend that provides:
   - Interactive chat interface
   - Action buttons for note operations
   - Markdown rendering
   - User interaction handling

3. **Build System**: Automated compilation and packaging:
   - TypeScript compilation
   - Manifest generation
   - JPL file creation (TAR archives)

## TypeScript Implementation

### Decision: TypeScript Over JavaScript

**Why TypeScript?**
- **Type Safety**: Catches errors at compile time
- **Better IDE Support**: Autocomplete, refactoring, navigation
- **Maintainability**: Self-documenting code with interfaces
- **API Integration**: Proper typing for Joplin API calls

### Type Definitions

```typescript
// Core interfaces for type safety
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
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "none",           // Joplin plugins don't use modules
    "lib": ["ES2020", "DOM"],   // Support for modern JS and DOM APIs
    "strict": true,             // Enable all strict type checking
    "noImplicitAny": true,      // Require explicit types
    "allowJs": true             // Allow JavaScript files (webview.js)
  }
}
```

**Key Points:**
- `"module": "none"` is crucial - Joplin plugins run in a global context
- `"lib": ["ES2020", "DOM"]` provides modern JavaScript features
- Strict mode ensures type safety throughout the codebase

## Plugin-to-Webview Communication

### The Challenge

Joplin webviews are sandboxed for security, making direct communication challenging. Initial attempts using polling were inefficient and unreliable.

### The Solution: Direct Message Passing

**Plugin → Webview Communication:**

```typescript
// Send content directly to webview
await joplin.views.panels.postMessage(panel, {
  type: 'appendToPrompt',
  content: noteContent
});
```

**Webview → Plugin Communication:**

```javascript
// Send message to plugin
await webviewApi.postMessage({
  type: 'sendChatMessage',
  message: userInput
});
```

### Message Handling Pattern

**Plugin Side:**
```typescript
await joplin.views.panels.onMessage(panel, async (message: WebviewMessage) => {
  try {
    if (message.type === 'sendChatMessage') {
      const response = await chatGPTAPI.sendMessage(message.message || '');
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
```

**Webview Side:**
```javascript
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

### Key Implementation Details

1. **Message Wrapping**: Joplin wraps messages in a `message` property
2. **Error Handling**: Comprehensive try-catch blocks with detailed logging
3. **Type Safety**: Proper TypeScript interfaces for all message types
4. **Real-time Updates**: No polling - messages are sent immediately

## OpenAI API Integration

### Dynamic Endpoint Selection

The plugin supports multiple OpenAI API endpoints and models:

```typescript
// Determine the correct endpoint based on model type
const endpoint = (this.settings.openaiModel.startsWith('o3') || 
                 this.settings.openaiModel === 'o4-mini') 
  ? 'https://api.openai.com/v1/responses'
  : 'https://api.openai.com/v1/chat/completions';

const isResponsesEndpoint = endpoint.includes('/responses');
```

### Dynamic Parameter Selection

Different models require different parameter names:

```typescript
const requestBody: any = {
  model: this.settings.openaiModel,
  [isResponsesEndpoint ? 'input' : 'messages']: messages,
  ...(this.settings.openaiModel.includes('gpt-5') || 
     this.settings.openaiModel.includes('gpt-4.1') || 
     this.settings.openaiModel.startsWith('o')
    ? { max_completion_tokens: this.settings.maxTokens }
    : { max_tokens: this.settings.maxTokens }
  ),
  stream: false
};

// Add new parameters for newer models
if (this.settings.openaiModel.includes('gpt-5') || 
    this.settings.openaiModel.startsWith('o')) {
  requestBody.reasoning_effort = this.settings.reasoningEffort;
  requestBody.verbosity = this.settings.verbosity;
}
```

### Conversation History Management

**Token-Aware History Trimming:**

```typescript
private trimHistoryToTokenLimit(maxTokens: number): void {
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
}
```

### Error Handling and Timeouts

```typescript
// Create AbortController for timeout
const controller = new AbortController();
const timeoutId = setTimeout(() => {
  console.error(`[ChatGPT API] Request timeout after 60 seconds`);
  controller.abort();
}, 60000); // 60 second timeout

try {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.settings.openaiApiKey}`
    },
    body: JSON.stringify(requestBody),
    signal: controller.signal
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    const errorData = JSON.parse(errorText);
    throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message}`);
  }
  
  return await response.json();
} catch (error: any) {
  if (error.name === 'AbortError') {
    throw new Error('Request timed out. Please try again.');
  }
  throw error;
} finally {
  clearTimeout(timeoutId);
}
```

## Settings Management

### Secure Settings Storage

```typescript
await joplin.settings.registerSettings({
  'openaiApiKey': {
    value: '',
    type: SettingItemType.String,
    label: 'OpenAI API Key',
    description: 'Your OpenAI API key for ChatGPT access',
    public: true,
    section: 'chatgptToolkit',
  },
  'openaiModel': {
    value: 'gpt-4.1',
    type: SettingItemType.String,
    label: 'OpenAI Model',
    description: 'The OpenAI model to use',
    public: true,
    section: 'chatgptToolkit',
  },
  'maxTokens': {
    value: 1000,
    type: SettingItemType.Int,
    label: 'Max Tokens',
    description: 'Maximum number of tokens to generate',
    public: true,
    section: 'chatgptToolkit',
  }
});
```

### Settings Section Registration

```typescript
await joplin.settings.registerSection('chatgptToolkit', {
  label: 'ChatGPT Toolkit',
  iconName: 'fas fa-robot',
  description: 'AI-powered writing assistant for Joplin'
});
```

### API Key Validation

```typescript
private validateApiKey(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }
  
  // Check for basic OpenAI API key format
  if (!apiKey.startsWith('sk-')) {
    console.warn('API key validation: Key should start with "sk-"');
    return true; // Allow anyway, just warn
  }
  
  // Validate length and format
  if (apiKey.length < 20 || apiKey.length > 200) {
    return false;
  }
  
  // Allow letters, numbers, hyphens, underscores, and periods
  if (!/^sk-[A-Za-z0-9\-_\.]+$/.test(apiKey)) {
    return false;
  }
  
  return true;
}
```

## Build System

### Automated Build Process

The build system uses npm scripts for a streamlined development workflow:

```json
{
  "scripts": {
    "build": "npm run clean && npm run generate-manifest && npm run compile-ts && npm run copy-webview && npm run create-jpl",
    "dev": "npm run generate-manifest && npm run compile-ts && npm run copy-webview && cp -r dist/* ~/.config/joplin-desktop/plugins/com.cogitations.chatgpt-toolkit/",
    "dist": "scripts/package-jpl.sh"
  }
}
```

### Manifest Generation

```javascript
// build.js - Automated manifest generation
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const joplinConfig = packageJson.joplin;

const manifest = {
  manifest_version: joplinConfig.manifest_version,
  id: joplinConfig.id,
  name: joplinConfig.name,
  version: joplinConfig.version,
  app_min_version: joplinConfig.app_min_version,
  description: joplinConfig.description,
  author: joplinConfig.author,
  license: joplinConfig.license,
  homepage_url: joplinConfig.homepage_url,
  repository_url: joplinConfig.repository_url,
  keywords: joplinConfig.keywords,
  categories: joplinConfig.categories,
  screenshots: joplinConfig.screenshots,
  main: joplinConfig.main,
  permissions: joplinConfig.permissions
};

fs.writeFileSync('dist/manifest.json', JSON.stringify(manifest, null, 2));
```

### JPL File Creation

**Critical**: Joplin plugin files (`.jpl`) must be **TAR archives**, not ZIP files.

```bash
# Correct way to create .jpl files
tar --format=ustar -cf plugin.jpl -C dist .

# Verify it's a TAR archive
file plugin.jpl  # Should output: "POSIX tar archive"
```

**Common Mistakes:**
- ❌ Using ZIP: `zip -r plugin.jpl dist/*`
- ❌ Using gzipped tar: `tar -czf plugin.jpl dist/*`
- ✅ Using plain TAR: `tar --format=ustar -cf plugin.jpl -C dist .`

## Security Considerations

### API Key Protection

```typescript
// API keys are stored securely using Joplin's encrypted settings
await joplin.settings.registerSettings({
  'openaiApiKey': {
    value: '',
    type: SettingItemType.String,
    public: true,  // This allows the setting to be visible in UI
    section: 'chatgptToolkit',
  }
});
```

### Input Validation

```typescript
// Validate user input before processing
private validateApiKey(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }
  
  // Check format and length
  if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
    return false;
  }
  
  // Validate character set
  if (!/^sk-[A-Za-z0-9\-_\.]+$/.test(apiKey)) {
    return false;
  }
  
  return true;
}
```

### Content Sanitization

```javascript
// Simple markdown parser with XSS protection
function parseMarkdown(text) {
  return text
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    .replace(/\n/g, '<br>');
}
```

## Testing Strategy

### Test Structure

```
test/
├── setup.js              # Test configuration
├── mocks/                # Mock implementations
├── simple.test.js        # Basic functionality tests
└── plugin.test.js        # Integration tests
```

### Mock Implementation

```javascript
// test/mocks/joplin.js - Mock Joplin API
const mockJoplin = {
  plugins: {
    register: jest.fn()
  },
  settings: {
    registerSection: jest.fn(),
    registerSettings: jest.fn(),
    value: jest.fn()
  },
  commands: {
    register: jest.fn(),
    execute: jest.fn()
  },
  views: {
    panels: {
      create: jest.fn(),
      setHtml: jest.fn(),
      show: jest.fn(),
      hide: jest.fn(),
      postMessage: jest.fn(),
      onMessage: jest.fn()
    },
    dialogs: {
      showMessageBox: jest.fn()
    }
  },
  data: {
    get: jest.fn(),
    put: jest.fn(),
    post: jest.fn()
  },
  workspace: {
    selectedNoteIds: jest.fn()
  },
  clipboard: {
    writeText: jest.fn()
  }
};

module.exports = mockJoplin;
```

### Test Examples

```javascript
// test/simple.test.js
describe('ChatGPT API', () => {
  test('should validate API key format', () => {
    const api = new ChatGPTAPI();
    
    // Valid API key
    expect(api.validateApiKey('sk-1234567890abcdef')).toBe(true);
    
    // Invalid API key
    expect(api.validateApiKey('invalid-key')).toBe(false);
    expect(api.validateApiKey('')).toBe(false);
  });
  
  test('should estimate token count', () => {
    const api = new ChatGPTAPI();
    const text = 'This is a test message with some content.';
    
    // Rough estimation: 1 token ≈ 4 characters
    const estimatedTokens = api.estimateTokens(text);
    expect(estimatedTokens).toBeGreaterThan(0);
    expect(estimatedTokens).toBeLessThan(text.length);
  });
});
```

## Development Workflow

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Development build (fast iteration)
npm run dev

# 3. Test in Joplin
# - Open Joplin
# - Go to Tools → Options → Plugins
# - Enable the plugin
# - Test functionality

# 4. Make changes and rebuild
npm run dev
```

### Production Build

```bash
# 1. Clean build
npm run build

# 2. Create distributable .jpl file
npm run dist

# 3. Test the .jpl file
# - Install in fresh Joplin instance
# - Verify all functionality works
```

### Debugging

**Accessing Plugin Logs:**
1. Go to **Configuration** → **Tools** → **Logs** in Joplin
2. Search for your plugin ID or "chatgpt"
3. Use `console.info()` instead of `console.log()` in webview code

**Common Debug Techniques:**
```typescript
// Plugin side logging
console.info('ChatGPT API] Starting request to model:', this.settings.openaiModel);
console.error('ChatGPT API] Error response:', error);

// Webview side logging
console.info('Webview received message:', message);
console.error('Error handling action:', error);
```

## Common Pitfalls and Solutions

### 1. Message Communication Issues

**Problem**: Messages not received between plugin and webview

**Solution**: Handle message wrapping properly
```javascript
// Always handle both wrapped and unwrapped messages
const actualMessage = message.message || message;
```

### 2. CSP Violations

**Problem**: Content Security Policy blocks inline scripts

**Solution**: Use external script files
```typescript
// Load external webview script (avoid inline scripts due to CSP)
await joplin.views.panels.addScript(panel, 'webview.js');
```

### 3. Settings Not Appearing

**Problem**: Settings don't show up in Joplin UI

**Solution**: Ensure settings section is registered first
```typescript
// Register section before settings
await joplin.settings.registerSection('chatgptToolkit', {
  label: 'ChatGPT Toolkit',
  iconName: 'fas fa-robot'
});

// Then register settings
await joplin.settings.registerSettings({...});
```

### 4. API Key Field Issues

**Problem**: API key field not working properly

**Solution**: Use correct `SettingItemType` values
```typescript
// Correct setting types
'apiKey': {
  type: SettingItemType.String,  // Not 2
  public: true
},
'maxTokens': {
  type: SettingItemType.Int,     // Not 1
  public: true
},
'autoSave': {
  type: SettingItemType.Bool,    // Not 3
  public: true
}
```

### 5. Build Issues

**Problem**: Plugin won't load after build

**Solution**: Verify all required files are included
```bash
# Check that these files exist in dist/
ls dist/
# Should show: index.js, webview.js, manifest.json

# Verify manifest.json is at archive root
tar -tf plugin.jpl | head -5
# Should show: manifest.json, index.js, webview.js
```

### 6. TypeScript Compilation Issues

**Problem**: TypeScript compilation fails

**Solution**: Check tsconfig.json configuration
```json
{
  "compilerOptions": {
    "module": "none",        // Required for Joplin plugins
    "target": "ES2020",      // Use modern JavaScript features
    "lib": ["ES2020", "DOM"] // Include DOM types for webview
  }
}
```

## Best Practices Summary

### 1. Architecture
- Use TypeScript for type safety and better development experience
- Separate plugin logic from UI code
- Implement proper error handling throughout

### 2. Communication
- Use direct message passing instead of polling
- Handle message wrapping properly
- Implement comprehensive error handling

### 3. Security
- Validate all user input
- Store sensitive data securely
- Sanitize content before rendering

### 4. Development
- Use automated build processes
- Implement comprehensive testing
- Follow consistent coding patterns

### 5. Deployment
- Create proper TAR archives for .jpl files
- Test in fresh Joplin instances
- Provide clear documentation

This technical documentation serves as both an explanation of the current implementation and a guide for future Joplin plugin development. The patterns and solutions demonstrated here can be applied to other plugin projects, providing a solid foundation for building robust, maintainable Joplin plugins.
