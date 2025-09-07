# Testing Guide for Joplin ChatGPT Plugin

This document provides comprehensive testing procedures for the Joplin ChatGPT Plugin.

## Test Environment Setup

### Prerequisites
- Node.js (v16 or higher)
- Joplin desktop app (latest version)
- OpenAI API key for integration testing
- Git for version control

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd joplin-chatgpt-plugin

# Install dependencies
npm install

# Build the plugin
npm run build
```

## Test Categories

### 1. Unit Tests

Unit tests verify individual functions and components in isolation.

#### Running Unit Tests
```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test -- --coverage
```

#### Test Coverage Areas
- **ChatGPT API Integration** (`test/chatgpt-api.test.ts`)
  - API key validation
  - Message sending and response handling
  - Error handling for different HTTP status codes
  - Network error handling
  - Note improvement functionality
  - Tag generation
  - Note summarization

- **Settings Management** (`test/settings.test.ts`)
  - Setting registration
  - Setting retrieval
  - Setting updates
  - Default value handling

- **Command Execution** (`test/commands.test.ts`)
  - Command registration
  - Command execution with valid inputs
  - Error handling for invalid inputs
  - Note selection validation

### 2. Integration Tests

Integration tests verify the interaction between different components.

#### Manual Integration Testing

1. **Plugin Installation Test**
   ```bash
   # Build the plugin
   npm run build
   
   # Copy dist folder to Joplin plugins directory
   # Enable plugin in Joplin settings
   # Verify plugin appears in plugin list
   ```

2. **API Key Configuration Test**
   - Open Joplin settings → Plugins → ChatGPT Integration
   - Enter a valid OpenAI API key
   - Verify key is stored securely
   - Test with invalid API key (should show error)

3. **Chat Panel Test**
   - Open ChatGPT side panel
   - Verify panel loads correctly
   - Test chat interface functionality
   - Verify message history persistence
   - Test panel resizing and responsiveness

4. **Command Execution Test**
   - Test each command from command palette
   - Verify proper error handling for missing notes
   - Test with various note content types
   - Verify clipboard operations

### 3. User Acceptance Tests

#### Test Scenarios

**Scenario 1: Note Improvement**
1. Create a test note with basic content
2. Use "Improve Note with ChatGPT" command
3. Verify note content is enhanced
4. Check that original meaning is preserved

**Scenario 2: Content Generation**
1. Select a note with research content
2. Use "Use Note as ChatGPT Prompt" command
3. Enter a specific request (e.g., "summarize this")
4. Verify appropriate response is generated
5. Test copy to clipboard functionality

**Scenario 3: Tag Generation**
1. Create a note about a specific topic
2. Use "Generate Tags with ChatGPT" command
3. Verify relevant tags are suggested
4. Test adding tags to the note

**Scenario 4: Selection Replacement**
1. Create a note with multiple paragraphs
2. Select a specific paragraph
3. Use "Replace Selection with ChatGPT Output" command
4. Verify only selected text is replaced

**Scenario 5: Chat with Context**
1. Open chat panel
2. Select a note
3. Use "Use Note Context" button
4. Ask questions about the note content
5. Verify responses are contextually relevant

### 4. Performance Tests

#### Response Time Testing
- Measure API response times for different content lengths
- Test with various model configurations
- Verify timeout handling for slow responses

#### Memory Usage Testing
- Monitor memory usage during extended chat sessions
- Test with large note collections
- Verify proper cleanup of resources

### 5. Security Tests

#### API Key Security
- Verify API key is stored encrypted
- Test that key is not exposed in logs
- Verify key is not transmitted to unauthorized endpoints

#### Data Privacy
- Confirm no user data is logged
- Verify only necessary data is sent to OpenAI
- Test data sanitization for sensitive content

## Test Data

### Sample Notes for Testing

**Test Note 1: Simple Content**
```
# Meeting Notes
- Discussed project timeline
- Assigned tasks to team members
- Next meeting scheduled for Friday
```

**Test Note 2: Complex Content**
```
# Research Paper: Machine Learning in Healthcare

## Abstract
This paper explores the applications of machine learning algorithms in healthcare settings, focusing on diagnostic accuracy and patient outcomes.

## Introduction
Machine learning has revolutionized many industries, and healthcare is no exception...

## Methodology
We conducted a comprehensive review of existing literature...
```

**Test Note 3: Technical Content**
```
# Code Review Checklist

## Frontend
- [ ] Responsive design implementation
- [ ] Cross-browser compatibility
- [ ] Performance optimization
- [ ] Accessibility compliance

## Backend
- [ ] API endpoint security
- [ ] Database query optimization
- [ ] Error handling
- [ ] Logging implementation
```

## Automated Testing Scripts

### Test Script 1: Basic Functionality
```bash
#!/bin/bash
# basic-functionality-test.sh

echo "Running basic functionality tests..."

# Build plugin
npm run build

# Run unit tests
npm test

# Check for build errors
if [ $? -eq 0 ]; then
    echo "✅ Basic functionality tests passed"
else
    echo "❌ Basic functionality tests failed"
    exit 1
fi
```

### Test Script 2: Integration Test
```bash
#!/bin/bash
# integration-test.sh

echo "Running integration tests..."

# Check if Joplin is running
if ! pgrep -x "Joplin" > /dev/null; then
    echo "❌ Joplin is not running. Please start Joplin first."
    exit 1
fi

# Verify plugin installation
echo "✅ Integration tests completed"
```

## Continuous Integration

### GitHub Actions Workflow
```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
        
    - name: Install dependencies
      run: npm install
      
    - name: Run linting
      run: npm run lint
      
    - name: Run tests
      run: npm test
      
    - name: Build plugin
      run: npm run build
```

## Bug Reporting

### Test Failure Reporting Template
```
**Test Environment:**
- OS: [e.g., macOS 12.0]
- Joplin Version: [e.g., 2.8.8]
- Plugin Version: [e.g., 1.0.0]
- Node.js Version: [e.g., 16.14.0]

**Test Case:**
[Describe the specific test case that failed]

**Expected Behavior:**
[What should have happened]

**Actual Behavior:**
[What actually happened]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Error Messages:**
[Include any error messages or console output]

**Additional Context:**
[Any other relevant information]
```

## Test Maintenance

### Regular Test Updates
- Update tests when adding new features
- Review and update test data quarterly
- Maintain test environment compatibility
- Update documentation for new test scenarios

### Test Data Management
- Keep test notes in a separate test notebook
- Regularly clean up test data
- Maintain diverse test content types
- Update test scenarios based on user feedback

## Performance Benchmarks

### Expected Performance Metrics
- **API Response Time**: < 5 seconds for typical requests
- **Plugin Load Time**: < 2 seconds
- **Memory Usage**: < 50MB for normal operation
- **Chat Panel Render**: < 1 second

### Monitoring
- Track performance metrics over time
- Set up alerts for performance degradation
- Regular performance testing with different content sizes
- Monitor API usage and costs

This testing guide ensures comprehensive validation of the Joplin ChatGPT Plugin across all functionality areas, providing confidence in the plugin's reliability and performance.
