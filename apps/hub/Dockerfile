FROM oven/bun:1 AS base

# Install curl for health checks
RUN apt-get update && \
    apt-get install -y curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dependencies stage
FROM base AS deps

# Copy root workspace configuration
COPY package.json bun.lock* ./
COPY apps/hub/package.json ./apps/hub/

# Copy workspace package.json files that are dependencies
COPY clients/registry/package.json ./clients/registry/
COPY clients/registry-internal/package.json ./clients/registry-internal/

# Install dependencies from the hub app directory (production only)
WORKDIR /app/apps/hub
RUN bun install --frozen-lockfile --production

# Build stage
FROM base AS builder

# Copy root workspace configuration
COPY package.json bun.lock* ./
COPY apps/hub/package.json ./apps/hub/

# Copy workspace package.json files that are dependencies
COPY clients/registry/package.json ./clients/registry/
COPY clients/registry-internal/package.json ./clients/registry-internal/

# Install all dependencies (including devDependencies for Prisma generation)
WORKDIR /app/apps/hub
RUN bun install --frozen-lockfile

# Copy Prisma schema
COPY apps/hub/prisma ./prisma
COPY apps/hub/prisma.config.ts ./prisma.config.ts

# Generate Prisma client
RUN bun prisma generate

# Copy source code
COPY apps/hub/src ./src
COPY apps/hub/tsconfig.json ./tsconfig.json

# Production stage
FROM base AS runner

WORKDIR /app

RUN apt-get update && \
    apt-get install -y curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy dependencies from deps stage
COPY --from=deps /app/apps/hub/node_modules ./node_modules

# Copy generated Prisma client from builder
COPY --from=builder /app/apps/hub/prisma/generated ./prisma/generated

# Copy Prisma schema (needed for db push)
COPY --from=builder /app/apps/hub/prisma ./prisma
COPY --from=builder /app/apps/hub/prisma.config.ts ./prisma.config.ts

# Copy source code
COPY --from=builder /app/apps/hub/src ./src
COPY --from=builder /app/apps/hub/package.json ./package.json
COPY --from=builder /app/apps/hub/tsconfig.json ./tsconfig.json

# Create non-root user for security
RUN groupadd -r metorial && useradd -r -g metorial metorial && \
    chown -R metorial:metorial /app

USER metorial

# Expose port
EXPOSE 52045
EXPOSE 52046

# Health check using curl
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
    CMD curl -f http://localhost:52045/ping && \
    curl -f http://localhost:52046/ping || exit 1

# Start command: push schema and start service
CMD ["sh", "-c", "bun prisma db push && bun src/server.ts"]
