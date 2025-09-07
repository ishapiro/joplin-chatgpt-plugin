#!/bin/bash

# Setup script for OpenAI API key configuration
echo "🔧 Setting up OpenAI API key for Joplin ChatGPT Plugin..."

# Check if .env.local already exists
if [ -f ".env.local" ]; then
    echo "⚠️  .env.local already exists. Backing up to .env.local.backup"
    cp .env.local .env.local.backup
fi

# Copy example file to .env.local
if [ -f "env.example" ]; then
    cp env.example .env.local
    echo "✅ Created .env.local from env.example"
else
    echo "❌ env.example not found. Creating .env.local manually..."
    cat > .env.local << EOF
# OpenAI API Configuration
# Get your API key from: https://platform.openai.com/api-keys
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Override default model
# OPENAI_MODEL=gpt-3.5-turbo

# Optional: Override default settings
# OPENAI_MAX_TOKENS=1000
# OPENAI_TEMPERATURE=0.7
EOF
fi

echo ""
echo "📝 Next steps:"
echo "1. Edit .env.local and replace 'your_openai_api_key_here' with your actual OpenAI API key"
echo "2. Get your API key from: https://platform.openai.com/api-keys"
echo "3. Run 'npm test' to test the OpenAI integration"
echo ""
echo "🔒 Security note: .env.local is already in .gitignore and will not be committed to git"
