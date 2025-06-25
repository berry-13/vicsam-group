# Multi-stage build per ottimizzare l'immagine finale
FROM node:20-alpine AS base

# Install build dependencies only once
RUN apk add --no-cache python3 make g++ && \
    npm config set fund false && \
    npm config set audit false

# Set working directory
WORKDIR /app

#################################
# Dependencies stage
#################################
FROM base AS deps

# Copy package files for server first (better caching)
COPY package*.json ./

# Install server dependencies (only production for now)
RUN npm install --omit=dev --no-audit --no-fund && \
    npm cache clean --force

# Create a separate stage for dev dependencies
FROM base AS deps-dev

# Copy package files for server
COPY package*.json ./

# Install all dependencies (including dev for client build)
RUN npm install --no-audit --no-fund && \
    npm cache clean --force

#################################
# Client build stage
#################################
FROM base AS client-builder

# Copy client package files
COPY client/package*.json ./client/

# Install client dependencies
WORKDIR /app/client
RUN npm install --no-audit --no-fund && \
    npm cache clean --force

# Copy client source code
COPY client/ ./

# Build client (optimized build)
RUN npm run build:fast

#################################
# Production stage
#################################
FROM node:20-alpine AS production

# Install dumb-init for signal handling
RUN apk add --no-cache dumb-init

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs

# Set working directory
WORKDIR /app

# Copy production dependencies from deps stage
COPY --from=deps --chown=appuser:nodejs /app/node_modules ./node_modules

# Copy built client from client-builder stage
COPY --from=client-builder --chown=appuser:nodejs /app/client/dist ./client/dist

# Copy application files
COPY --chown=appuser:nodejs server.js package.json ./
COPY --chown=appuser:nodejs api ./api

# Create directories for data and logs with proper permissions
RUN mkdir -p /app/data /app/logs && \
    chown -R appuser:nodejs /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Optimized health check (less frequent, faster)
HEALTHCHECK --interval=60s --timeout=10s --start-period=10s --retries=2 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Set production environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false

# Start the application with proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
