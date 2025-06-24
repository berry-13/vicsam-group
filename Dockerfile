# Multi-stage build per ottimizzare l'immagine
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files for server
COPY package*.json ./

# Install server dependencies
RUN npm ci --only=production

# Copy client package files
COPY client/package*.json ./client/

# Install client dependencies
WORKDIR /app/client
RUN npm ci

# Copy client source code
COPY client/ ./

# Build client
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Installa dumb-init per gestire i segnali
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S appuser -u 1001

# Set working directory
WORKDIR /app

# Copy node_modules from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy built client from builder stage
COPY --from=builder /app/client/dist ./client/dist

# Copy application files
COPY --chown=appuser:nodejs server.js ./
COPY --chown=appuser:nodejs api ./api
COPY --chown=appuser:nodejs package.json ./

# Create directories for data and logs
RUN mkdir -p /app/data /app/logs && chown -R appuser:nodejs /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
