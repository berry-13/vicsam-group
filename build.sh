#!/bin/bash

# Build script semplice per Vicsam Group
set -e

echo "🚀 Building Vicsam Group..."

# Build client
cd client
npm run build:fast
cd ..

echo "✅ Build completed!"

# Show build size
if [ -d "client/dist" ]; then
    echo "📦 Build size: $(du -sh client/dist | cut -f1)"
fi
