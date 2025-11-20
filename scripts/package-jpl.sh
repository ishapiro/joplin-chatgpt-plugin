#!/usr/bin/env bash
set -euo pipefail

# --- Config (adjust if your build outputs differ) ---
PLUGIN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="$PLUGIN_ROOT/dist"
# Files/folders to include at ZIP root from dist directory:
# Your build process puts everything needed in dist/
DIST_INCLUDE=("manifest.json" "index.js" "webview.js")
# Additional files from root (if they exist):
ROOT_INCLUDE=("README.md" "LICENSE" "icons" "assets")

# --- Preconditions ---
cd "$PLUGIN_ROOT"
command -v node >/dev/null 2>&1 || { echo "Node is required"; exit 1; }

# --- Install deps & build ---
if [ -f package.json ]; then
  # Check if node_modules exists, if not install dependencies
  if [ ! -d "node_modules" ]; then
    echo "==> npm install (node_modules not found)"
    npm install
  fi
  # Check if build script exists in package.json
  if node -e "const pkg = require('./package.json'); process.exit(pkg.scripts && pkg.scripts.build ? 0 : 1)" 2>/dev/null; then
    echo "==> npm run build"
    npm run build
  else
    echo "==> Build script not found in package.json, skipping build"
  fi
fi

# --- Read manifest for name/version from dist (since that's where your build puts it) ---
if [ ! -f "$DIST_DIR/manifest.json" ]; then
  echo "manifest.json not found in dist directory. Run build first."
  exit 1
fi

PLUGIN_NAME="$(node -e 'console.log(require("./dist/manifest.json").name || "")' || true)"
PLUGIN_VERSION="$(node -e 'console.log(require("./dist/manifest.json").version || "")' || true)"

if [[ -z "$PLUGIN_NAME" || -z "$PLUGIN_VERSION" ]]; then
  echo "Could not read name/version from dist/manifest.json"
  exit 1
fi

# Clean the plugin name for filename (replace spaces with dashes, lowercase)
CLEAN_NAME="$(echo "$PLUGIN_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')"
OUT="$DIST_DIR/${CLEAN_NAME}-${PLUGIN_VERSION}.jpl"

# --- Create a staging dir to control ZIP root layout ---
STAGE="$(mktemp -d)"
cleanup() { rm -rf "$STAGE"; }
trap cleanup EXIT

# Copy dist files (these are the main plugin files)
echo "==> Staging plugin files from dist/"
for item in "${DIST_INCLUDE[@]}"; do
  if [ -f "$DIST_DIR/$item" ]; then
    rsync -a --exclude ".DS_Store" "$DIST_DIR/$item" "$STAGE/"
  else
    echo "Warning: $DIST_DIR/$item not found"
  fi
done

# Copy additional root files if they exist
echo "==> Staging additional files from root"
for item in "${ROOT_INCLUDE[@]}"; do
  if [ -e "$item" ]; then
    rsync -a --exclude ".DS_Store" "$item" "$STAGE/"
  fi
done

# Ensure manifest made it to root
if [ ! -f "$STAGE/manifest.json" ]; then
  echo "manifest.json is not at archive root after staging"
  exit 1
fi

# --- Create TAR archive for .jpl (Joplin expects TAR, not ZIP) ---
echo "==> Packaging $OUT"
cd "$STAGE"
# Create plain tar archive with ustar format for maximum compatibility
tar --format=ustar -cf "$OUT" .

# --- Remove macOS quarantine attribute (if any) ---
if command -v xattr >/dev/null 2>&1; then
  xattr -d com.apple.quarantine "$OUT" 2>/dev/null || true
fi

# --- Quick validation ---
echo "==> Validating archive contents:"
tar -tf "$OUT" | head -10
echo "==> Done: $OUT"

# --- Show file size ---
if command -v ls >/dev/null 2>&1; then
  echo "==> File size: $(ls -lh "$OUT" | awk '{print $5}')"
fi
