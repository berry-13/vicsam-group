# Makefile for VicSam Group build optimization

.PHONY: help build build-fast build-dev clean test docker-build docker-run docker-dev docker-clean

# Default help command
help:
	@echo "VicSam Group Build Commands:"
	@echo ""
	@echo "Local Development:"
	@echo "  build       - Build the client application"
	@echo "  build-fast  - Fast build with optimizations"
	@echo "  build-dev   - Development build with watch"
	@echo "  test        - Run tests"
	@echo "  clean       - Clean build artifacts"
	@echo ""
	@echo "Docker Commands:"
	@echo "  docker-build     - Build Docker image"
	@echo "  docker-build-fast - Build Docker image with cache"
	@echo "  docker-run       - Run Docker container"
	@echo "  docker-dev       - Run development environment"
	@echo "  docker-clean     - Clean Docker resources"
	@echo ""
	@echo "CI/CD:"
	@echo "  ci-test     - Run CI tests"
	@echo "  ci-build    - Run CI build process"

# Local build commands
build:
	npm run build

build-fast:
	npm run build --if-present

build-dev:
	cd client && npm run dev

test:
	npm run test:ci

clean:
	npm run clean
	docker system prune -f

# Docker commands with optimizations
docker-build:
	docker build -t vicsam-group:latest .

docker-build-fast:
	docker build \
		--target production \
		--cache-from vicsam-group:latest \
		--cache-from node:20-alpine \
		-t vicsam-group:latest .

docker-build-dev:
	docker build \
		--target base \
		-t vicsam-group:dev .

docker-run:
	docker run -d \
		--name vicsam-api \
		-p 3000:3000 \
		-e NODE_ENV=production \
		vicsam-group:latest

docker-dev:
	docker-compose --profile dev up --build

docker-clean:
	docker container prune -f
	docker image prune -f
	docker builder prune -f

# CI/CD optimized commands
ci-test:
	npm ci --prefer-offline --no-audit --no-fund
	npm run test:ci

ci-build:
	npm ci --prefer-offline --no-audit --no-fund
	npm run build

# Performance monitoring
docker-stats:
	docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"

# Quick development setup
dev-setup:
	npm install
	cd client && npm install
	echo "✅ Development environment ready!"

# Production deployment helper
deploy-check:
	@echo "🔍 Pre-deployment checks:"
	@echo "- Docker image size: $$(docker images vicsam-group:latest --format 'table {{.Size}}')"
	@echo "- Security scan: Running Trivy..."
	@docker pull aquasec/trivy:latest 2>/dev/null || true
	@docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
		aquasec/trivy:latest image vicsam-group:latest || echo "⚠️  Install Trivy for security scanning"
