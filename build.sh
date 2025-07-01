#!/bin/bash

# Build script semplice per Vicsam Group
set -e

echo "🚀 Building Vicsam Group..."

# Generate build info
echo "📝 Generating build information..."
npm run build:info

# Build client
cd client
npm run build:fast
cd ..

echo "✅ Build completed!"
echo "📊 Version info:"
npm run version:info

# Show build size
if [ -d "client/dist" ]; then
    echo "📦 Build size: $(du -sh client/dist | cut -f1)"
fi
