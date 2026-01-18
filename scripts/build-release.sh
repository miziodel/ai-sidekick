#!/bin/bash
# Copyright (c) 2026 Maurizio Delmonte
# Licensed under the MIT License

set -e  # Exit on error

echo "🚀 AI Sidekick Release Builder"
echo "================================"

# Extract version from manifest.json
VERSION=$(grep '"version"' manifest.json | head -1 | sed 's/.*: "\(.*\)".*/\1/')

if [ -z "$VERSION" ]; then
  echo "❌ Error: Could not extract version from manifest.json"
  exit 1
fi

OUTPUT="ai-sidekick-v${VERSION}.zip"
TEMP_DIR=".release-temp"

echo "📦 Building release: $OUTPUT"
echo "   Version: $VERSION"
echo ""

# Remove partial/previous build
if [ -f "$OUTPUT" ]; then
  rm "$OUTPUT"
fi

# Clean up any existing temp directory
if [ -d "$TEMP_DIR" ]; then
  echo "🧹 Cleaning previous build..."
  rm -rf "$TEMP_DIR"
fi

# Create temp directory
mkdir -p "$TEMP_DIR"

# Copy runtime files
echo "📂 Copying files..."
cp manifest.json "$TEMP_DIR/"
cp README.md "$TEMP_DIR/"
cp LICENSE "$TEMP_DIR/"
cp -r src "$TEMP_DIR/"

# Remove any hidden files (e.g., .DS_Store)
find "$TEMP_DIR" -name ".DS_Store" -delete

# Create ZIP
echo "🗜️  Creating archive..."
cd "$TEMP_DIR"
zip -r "../$OUTPUT" . -q
cd ..

# Cleanup
rm -rf "$TEMP_DIR"

# Show result
echo ""
echo "✅ Release created: $OUTPUT"
ls -lh "$OUTPUT"
echo ""
echo "📋 Next steps:"
echo "   1. Test the ZIP: Load in Chrome to verify"
echo "   2. Create GitHub tag: git tag -a v${VERSION} -m 'Release v${VERSION}'"
echo "   3. Push tag: git push origin v${VERSION}"
echo "   4. Upload $OUTPUT to GitHub Release page"
