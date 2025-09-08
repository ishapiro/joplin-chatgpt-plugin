#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Extract Joplin plugin configuration
const joplinConfig = packageJson.joplin;

// Create manifest.json
const manifest = {
  manifest_version: joplinConfig.manifest_version,
  id: joplinConfig.id,
  name: joplinConfig.name,
  version: joplinConfig.version,
  app_min_version: joplinConfig.app_min_version,
  description: joplinConfig.description,
  author: joplinConfig.author,
  homepage_url: joplinConfig.homepage_url,
  repository_url: joplinConfig.repository_url,
  keywords: joplinConfig.keywords,
  categories: joplinConfig.categories,
  screenshots: joplinConfig.screenshots,
  main: joplinConfig.main,
  permissions: joplinConfig.permissions
};

// Ensure dist directory exists
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Write manifest.json to dist directory
fs.writeFileSync('dist/manifest.json', JSON.stringify(manifest, null, 2));

console.log('✅ Generated dist/manifest.json from package.json');
