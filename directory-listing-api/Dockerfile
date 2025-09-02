# Stage 1: Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies including build tools
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/
COPY tests/ ./src/tests/

# Build the application
RUN npm run build

# Remove dev dependencies
RUN rm -rf node_modules && \
    npm ci --only=production --ignore-scripts

# Stage 2: Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S api -u 1001

# Install runtime dependencies
RUN apk add --no-cache \
    tini \
    su-exec

# Copy built application and dependencies
COPY --from=builder --chown=api:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=api:nodejs /app/dist ./dist
COPY --from=builder --chown=api:nodejs /app/package.json ./

# Create data directory for persistent storage
RUN mkdir -p /app/data && \
    chown -R api:nodejs /app/data

# Create logs directory
RUN mkdir -p /app/logs && \
    chown -R api:nodejs /app/logs

# Switch to non-root user
USER api

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node dist/health-check.js

# Use tini as init process
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application
CMD ["node", "dist/app.js"]