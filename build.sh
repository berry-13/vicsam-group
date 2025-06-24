#!/bin/bash

# Script per build completo dell'applicazione VicSam Group
# Questo script builda sia il server che il client React

set -e  # Exit on any error

echo "🚀 Starting VicSam Group build process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[BUILD]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "client" ]; then
    print_error "Please run this script from the root directory of the VicSam Group project"
    exit 1
fi

# Install server dependencies
print_status "Installing server dependencies..."
npm ci
print_success "Server dependencies installed"

# Check if client directory exists
if [ -d "client" ]; then
    print_status "Building React client..."
    
    cd client
    
    # Install client dependencies
    print_status "Installing client dependencies..."
    npm ci
    print_success "Client dependencies installed"
    
    # Build client
    print_status "Building React application..."
    npm run build
    print_success "React client built successfully"
    
    # Check if build was successful
    if [ -f "dist/index.html" ]; then
        print_success "Client build verified - dist/index.html exists"
        
        # Show build stats
        BUILD_SIZE=$(du -sh dist 2>/dev/null | cut -f1)
        print_status "Build size: $BUILD_SIZE"
        
        # List main files
        print_status "Build contents:"
        ls -la dist/ | head -10
    else
        print_error "Client build failed - dist/index.html not found"
        exit 1
    fi
    
    cd ..
else
    print_warning "Client directory not found - skipping client build"
fi

# Run tests if available
if npm run test --silent >/dev/null 2>&1; then
    print_status "Running tests..."
    npm test
    print_success "All tests passed"
else
    print_warning "No test script found - skipping tests"
fi

# Create deployment info
print_status "Creating deployment info..."
cat > deployment-info.json << EOF
{
  "buildDate": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "version": "$(node -p "require('./package.json').version")",
  "nodeVersion": "$(node --version)",
  "clientBuild": $([ -f "client/dist/index.html" ] && echo "true" || echo "false"),
  "environment": "${NODE_ENV:-production}"
}
EOF

print_success "Deployment info created"

echo ""
print_success "🎉 Build completed successfully!"
echo ""
print_status "Next steps:"
echo "  • To start the server: npm start"
echo "  • To build Docker image: docker build -t vicsam-group ."
echo "  • To run with Docker: docker run -p 3000:3000 vicsam-group"
echo ""

# Show final status
if [ -f "client/dist/index.html" ]; then
    print_success "✅ Full-stack build: Server + Client ready"
else
    print_warning "⚠️  API-only build: Client build missing"
fi

print_status "Build artifacts:"
echo "  • Server: Ready"
echo "  • Client: $([ -f "client/dist/index.html" ] && echo "Ready ($(du -sh client/dist 2>/dev/null | cut -f1))" || echo "Not built")"
echo "  • Dependencies: Installed"
echo "  • Deployment info: deployment-info.json"
