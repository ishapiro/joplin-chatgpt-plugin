#!/usr/bin/env node
/**
 * Deploy script for ChatGPT Toolkit Joplin Plugin
 * 
 * This script:
 * 1. Prompts user if they want to delete existing plugin files first
 * 2. Deletes plugin files from all OS-specific locations
 * 3. Builds the plugin
 * 4. Deploys to the appropriate Joplin plugin directory
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');
const readline = require('readline');

const PLUGIN_ID = 'com.cogitations.chatgpt-toolkit';

// Determine OS-specific paths
function getPluginPaths() {
  const platform = os.platform();
  const homeDir = os.homedir();
  const paths = {
    pluginDir: '',
    pluginJpl: '',
    pluginData: '',
    cacheDirs: [],
    tmpFiles: [],
    oldPluginDir: '' // For older Joplin versions
  };

  if (platform === 'win32') {
    // Windows paths
    const appData = process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming');
    const joplinBase = path.join(appData, 'Joplin');
    
    paths.pluginDir = path.join(joplinBase, 'plugins', PLUGIN_ID);
    paths.pluginJpl = path.join(joplinBase, 'plugins', `${PLUGIN_ID}.jpl`);
    paths.pluginData = path.join(joplinBase, 'plugin-data', PLUGIN_ID);
    paths.cacheDirs = [
      path.join(joplinBase, 'cache', PLUGIN_ID),
      path.join(joplinBase, 'cache', 'joplin-plugin-chatgpt-toolkit-python'),
      path.join(joplinBase, 'cache', 'joplin-plugin-chatgpt-toolkit-clean'),
      path.join(joplinBase, 'cache', 'joplin-plugin-chatgpt-toolkit-uncompressed'),
      path.join(joplinBase, 'cache', 'chatgpt-toolkit-1.0')
    ];
    paths.tmpFiles = [
      path.join(joplinBase, 'tmp', `plugin_${PLUGIN_ID}_theme_1.css`),
      path.join(joplinBase, 'tmp', `plugin_${PLUGIN_ID}.js`)
    ];
  } else {
    // macOS and Linux paths
    const configDir = path.join(homeDir, '.config', 'joplin-desktop');
    const oldConfigDir = path.join(homeDir, 'Library', 'Application Support', 'Joplin'); // macOS old location
    
    paths.pluginDir = path.join(configDir, 'plugins', PLUGIN_ID);
    paths.pluginJpl = path.join(configDir, 'plugins', `${PLUGIN_ID}.jpl`);
    paths.pluginData = path.join(configDir, 'plugin-data', PLUGIN_ID);
    paths.cacheDirs = [
      path.join(configDir, 'cache', PLUGIN_ID),
      path.join(configDir, 'cache', 'joplin-plugin-chatgpt-toolkit-python'),
      path.join(configDir, 'cache', 'joplin-plugin-chatgpt-toolkit-clean'),
      path.join(configDir, 'cache', 'joplin-plugin-chatgpt-toolkit-uncompressed'),
      path.join(configDir, 'cache', 'chatgpt-toolkit-1.0')
    ];
    paths.tmpFiles = [
      path.join(configDir, 'tmp', `plugin_${PLUGIN_ID}_theme_1.css`),
      path.join(configDir, 'tmp', `plugin_${PLUGIN_ID}.js`)
    ];
    
    // Old macOS location
    if (platform === 'darwin' && fs.existsSync(oldConfigDir)) {
      paths.oldPluginDir = path.join(oldConfigDir, 'plugins', PLUGIN_ID);
    }
  }

  return paths;
}

// Delete plugin files
function deletePluginFiles(paths) {
  console.log('\n🗑️  Deleting existing plugin files...\n');

  let deletedCount = 0;

  // Delete plugin directory
  if (fs.existsSync(paths.pluginDir)) {
    console.log(`  Removing: ${paths.pluginDir}`);
    fs.rmSync(paths.pluginDir, { recursive: true, force: true });
    deletedCount++;
  }

  // Delete plugin .jpl file
  if (fs.existsSync(paths.pluginJpl)) {
    console.log(`  Removing: ${paths.pluginJpl}`);
    fs.unlinkSync(paths.pluginJpl);
    deletedCount++;
  }

  // Delete plugin data directory
  if (fs.existsSync(paths.pluginData)) {
    console.log(`  Removing: ${paths.pluginData}`);
    fs.rmSync(paths.pluginData, { recursive: true, force: true });
    deletedCount++;
  }

  // Delete cache directories
  paths.cacheDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      console.log(`  Removing: ${dir}`);
      fs.rmSync(dir, { recursive: true, force: true });
      deletedCount++;
    }
  });

  // Delete temporary files
  paths.tmpFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`  Removing: ${file}`);
      fs.unlinkSync(file);
      deletedCount++;
    }
  });

  // Delete old plugin directory (macOS)
  if (paths.oldPluginDir && fs.existsSync(paths.oldPluginDir)) {
    console.log(`  Removing (old location): ${paths.oldPluginDir}`);
    fs.rmSync(paths.oldPluginDir, { recursive: true, force: true });
    deletedCount++;
  }

  if (deletedCount > 0) {
    console.log(`\n✅ Deleted ${deletedCount} plugin file(s)/directory(ies).\n`);
  } else {
    console.log('\n✅ No existing plugin files found to delete.\n');
  }
}

// Prompt user for confirmation
function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().trim());
    });
  });
}

// Main deploy function
async function deploy() {
  console.log('🚀 ChatGPT Toolkit Plugin Deploy Script\n');
  console.log(`Platform: ${os.platform()} (${os.type()})\n`);

  const paths = getPluginPaths();
  
  // Check if any plugin files exist
  const hasPluginFiles = 
    fs.existsSync(paths.pluginDir) ||
    fs.existsSync(paths.pluginJpl) ||
    fs.existsSync(paths.pluginData) ||
    paths.cacheDirs.some(dir => fs.existsSync(dir)) ||
    paths.tmpFiles.some(file => fs.existsSync(file)) ||
    (paths.oldPluginDir && fs.existsSync(paths.oldPluginDir));

  if (hasPluginFiles) {
    console.log('⚠️  Found existing plugin files.\n');
    const answer = await promptUser('Do you want to delete existing plugin files before deploying? (y/n): ');
    
    if (answer === 'y' || answer === 'yes') {
      deletePluginFiles(paths);
    } else {
      console.log('\n⏭️  Skipping deletion. Deploying over existing files...\n');
    }
  } else {
    console.log('✅ No existing plugin files found.\n');
  }

  // Build the plugin
  const isProduction = process.argv.includes('--prod') || process.env.NODE_ENV === 'production';
  const buildCommand = isProduction ? 'npm run build-prod' : 'npm run build';
  
  console.log(`📦 Building plugin${isProduction ? ' (production)' : ''}...\n`);
  try {
    execSync(buildCommand, { stdio: 'inherit' });
    console.log('\n✅ Build completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Build failed!');
    process.exit(1);
  }

  // Deploy to plugin directory
  console.log('📤 Deploying to Joplin plugin directory...\n');
  const distDir = path.join(__dirname, '..', 'dist');
  
  if (!fs.existsSync(distDir)) {
    console.error('❌ dist/ directory not found! Build may have failed.');
    process.exit(1);
  }

  // Create plugin directory if it doesn't exist
  if (!fs.existsSync(paths.pluginDir)) {
    fs.mkdirSync(paths.pluginDir, { recursive: true });
    console.log(`  Created: ${paths.pluginDir}`);
  }

  // Copy files from dist to plugin directory
  const files = fs.readdirSync(distDir);
  let copiedCount = 0;
  
  files.forEach(file => {
    const srcPath = path.join(distDir, file);
    const destPath = path.join(paths.pluginDir, file);
    
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      fs.cpSync(srcPath, destPath, { recursive: true });
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
    copiedCount++;
  });

  console.log(`\n✅ Deployed ${copiedCount} file(s) to: ${paths.pluginDir}\n`);
  console.log('🎉 Deployment complete!\n');
  console.log('📝 Next steps:');
  console.log('   1. Open Joplin');
  console.log('   2. Go to Tools → Options → Plugins');
  console.log('   3. Find "ChatGPT Toolkit"');
  console.log('   4. Click "Disable" then "Enable" to reload the plugin');
  console.log('   (Or restart Joplin completely)\n');
}

// Run deploy
deploy().catch(error => {
  console.error('\n❌ Deployment failed:', error);
  process.exit(1);
});

