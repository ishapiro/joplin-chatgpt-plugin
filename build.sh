#!/bin/bash

# Joplin ChatGPT Plugin Build Script
# This script builds the plugin and prepares it for installation

set -e  # Exit on any error

echo "🚀 Building Joplin ChatGPT Plugin..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Display versions
echo "📋 Environment Information:"
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run linting
echo "🔍 Running linting..."
npm run lint

# Run tests
echo "🧪 Running tests..."
npm test

# Build the plugin
echo "🔨 Building plugin..."
npm run build

# Check if build was successful
if [ -d "dist" ]; then
    echo "✅ Build successful!"
    echo "📁 Built files are in the 'dist' directory"
    
    # Display build contents
    echo "📋 Build contents:"
    ls -la dist/
    
    # Create installation instructions
    echo ""
    echo "📖 Installation Instructions:"
    echo "1. Copy the 'dist' folder to your Joplin plugins directory"
    echo "2. Restart Joplin"
    echo "3. Go to Tools → Options → Plugins"
    echo "4. Enable 'ChatGPT Integration' plugin"
    echo "5. Configure your OpenAI API key in the plugin settings"
    echo ""
    echo "🎉 Plugin is ready for installation!"
else
    echo "❌ Build failed! Check the error messages above."
    exit 1
fi
