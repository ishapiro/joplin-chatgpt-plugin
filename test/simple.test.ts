// Simple test to verify basic functionality
describe('Basic Plugin Tests', () => {
  it('should have proper package.json configuration', () => {
    const packageJson = require('../package.json');
    
    expect(packageJson.name).toBe('joplin-plugin-chatgpt');
    expect(packageJson.version).toBe('1.0.0');
    expect(packageJson.joplin).toBeDefined();
    expect(packageJson.joplin.name).toBe('ChatGPT Integration');
    expect(packageJson.joplin.permissions).toContain('settings');
    expect(packageJson.joplin.permissions).toContain('commands');
    expect(packageJson.joplin.permissions).toContain('panels');
  });

  it('should have required dependencies', () => {
    const packageJson = require('../package.json');
    
    expect(packageJson.dependencies).toBeDefined();
    expect(packageJson.dependencies.axios).toBeDefined();
    expect(packageJson.devDependencies).toBeDefined();
    expect(packageJson.devDependencies.typescript).toBeDefined();
    expect(packageJson.devDependencies.jest).toBeDefined();
  });

  it('should have proper TypeScript configuration', () => {
    const tsconfig = require('../tsconfig.json');
    
    expect(tsconfig.compilerOptions.target).toBe('ES2020');
    expect(tsconfig.compilerOptions.module).toBe('commonjs');
    expect(tsconfig.compilerOptions.outDir).toBe('./dist');
    expect(tsconfig.compilerOptions.rootDir).toBe('./src');
  });
});
