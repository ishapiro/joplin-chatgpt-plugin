// Simple tests for the ChatGPT Toolkit Plugin
const fs = require('fs');
const path = require('path');

describe('Basic Plugin Tests', () => {
  test('should have proper package.json configuration', () => {
    const packageJsonPath = path.join(__dirname, '../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    expect(packageJson.name).toBe('joplin-plugin-chatgpt');
    expect(packageJson.version).toBe('1.0.0');
    expect(packageJson.joplin).toBeDefined();
    expect(packageJson.joplin.name).toBe('ChatGPT Toolkit');
    expect(packageJson.joplin.permissions).toContain('settings');
    expect(packageJson.joplin.permissions).toContain('commands');
    expect(packageJson.joplin.permissions).toContain('panels');
  });

  test('should have main plugin file', () => {
    const pluginPath = path.join(__dirname, '../src/index.js');
    expect(fs.existsSync(pluginPath)).toBe(true);
    
    const pluginContent = fs.readFileSync(pluginPath, 'utf8');
    expect(pluginContent).toContain('ChatGPT Toolkit Plugin');
    expect(pluginContent).toContain('joplin.plugins.register');
  });

  test('should have build script', () => {
    const buildScriptPath = path.join(__dirname, '../build.js');
    expect(fs.existsSync(buildScriptPath)).toBe(true);
  });

  test('should have proper manifest generation', () => {
    const packageJsonPath = path.join(__dirname, '../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    expect(packageJson.joplin.id).toBe('com.cogitations.chatgpttoolkit');
    expect(packageJson.joplin.app_min_version).toBe('2.10');
    expect(packageJson.joplin.main).toBe('index.js');
  });
});
