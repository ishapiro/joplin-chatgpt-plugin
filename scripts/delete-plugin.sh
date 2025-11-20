#!/bin/bash
# Script to manually delete the ChatGPT Toolkit plugin from Joplin
# Run this if Joplin's built-in delete doesn't work

echo "Deleting ChatGPT Toolkit plugin files..."

# Plugin directory
PLUGIN_DIR="$HOME/.config/joplin-desktop/plugins/com.cogitations.chatgpt-toolkit"
if [ -d "$PLUGIN_DIR" ]; then
    echo "Removing plugin directory: $PLUGIN_DIR"
    rm -rf "$PLUGIN_DIR"
fi

# Plugin .jpl file
PLUGIN_JPL="$HOME/.config/joplin-desktop/plugins/com.cogitations.chatgpt-toolkit.jpl"
if [ -f "$PLUGIN_JPL" ]; then
    echo "Removing plugin .jpl file: $PLUGIN_JPL"
    rm -f "$PLUGIN_JPL"
fi

# Plugin data directory (contains system-prompt.txt)
PLUGIN_DATA="$HOME/.config/joplin-desktop/plugin-data/com.cogitations.chatgpt-toolkit"
if [ -d "$PLUGIN_DATA" ]; then
    echo "Removing plugin data directory: $PLUGIN_DATA"
    rm -rf "$PLUGIN_DATA"
fi

# Cache directories
CACHE_DIRS=(
    "$HOME/.config/joplin-desktop/cache/com.cogitations.chatgpt-toolkit"
    "$HOME/.config/joplin-desktop/cache/joplin-plugin-chatgpt-toolkit-python"
    "$HOME/.config/joplin-desktop/cache/joplin-plugin-chatgpt-toolkit-clean"
    "$HOME/.config/joplin-desktop/cache/joplin-plugin-chatgpt-toolkit-uncompressed"
    "$HOME/.config/joplin-desktop/cache/chatgpt-toolkit-1.0"
)

for dir in "${CACHE_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "Removing cache directory: $dir"
        rm -rf "$dir"
    fi
done

# Temporary files
TMP_FILES=(
    "$HOME/.config/joplin-desktop/tmp/plugin_com.cogitations.chatgpt-toolkit_theme_1.css"
    "$HOME/.config/joplin-desktop/tmp/plugin_com.cogitations.chatgpt-toolkit.js"
)

for file in "${TMP_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "Removing temporary file: $file"
        rm -f "$file"
    fi
done

echo "Done! All ChatGPT Toolkit plugin files have been removed."
echo "Please restart Joplin to complete the removal."

