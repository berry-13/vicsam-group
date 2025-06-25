#!/bin/bash

# Build script semplice per VicSam Group
set -e

echo "🚀 Building VicSam Group..."

# Build client
cd client
npm run build:fast
cd ..

echo "✅ Build completed!"

# Show build size
if [ -d "client/dist" ]; then
    echo "📦 Build size: $(du -sh client/dist | cut -f1)"
fi
