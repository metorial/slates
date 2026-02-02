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

# Copy all workspace package.json files
COPY apps/hub/package.json ./apps/hub/
COPY apps/registry/package.json ./apps/registry/
COPY clients/hub/package.json ./clients/hub/
COPY clients/registry/package.json ./clients/registry/
COPY clients/registry-internal/package.json ./clients/registry-internal/
COPY packages/proto/package.json ./packages/proto/
COPY packages/provider/package.json ./packages/provider/
COPY packages/provider-handler/package.json ./packages/provider-handler/
COPY packages/slates/package.json ./packages/slates/
COPY packages/tsconfig/package.json ./packages/tsconfig/

# Install dependencies from workspace root (production only)
RUN bun install --frozen-lockfile --production

# Build stage
FROM base AS builder

# Copy root workspace configuration
COPY package.json bun.lock* ./

# Copy all workspace package.json files
COPY apps/hub/package.json ./apps/hub/
COPY apps/registry/package.json ./apps/registry/
COPY clients/hub/package.json ./clients/hub/
COPY clients/registry/package.json ./clients/registry/
COPY clients/registry-internal/package.json ./clients/registry-internal/
COPY packages/proto/package.json ./packages/proto/
COPY packages/provider/package.json ./packages/provider/
COPY packages/provider-handler/package.json ./packages/provider-handler/
COPY packages/slates/package.json ./packages/slates/
COPY packages/tsconfig/package.json ./packages/tsconfig/

# Install all dependencies from workspace root (including devDependencies)
RUN bun install --frozen-lockfile

# Copy Prisma schema
COPY apps/hub/prisma ./apps/hub/prisma
COPY apps/hub/prisma.config.ts ./apps/hub/prisma.config.ts

# Generate Prisma client
WORKDIR /app/apps/hub
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

# Copy generated Prisma client from builder
COPY --from=builder /app/apps/hub/prisma/generated ./apps/hub/prisma/generated

# Copy Prisma schema (needed for db push)
COPY --from=builder /app/apps/hub/prisma ./apps/hub/prisma
COPY --from=builder /app/apps/hub/prisma.config.ts ./apps/hub/prisma.config.ts

# Copy source code
COPY --from=builder /app/apps/hub/src ./apps/hub/src
COPY --from=builder /app/apps/hub/package.json ./apps/hub/package.json
COPY --from=builder /app/apps/hub/tsconfig.json ./apps/hub/tsconfig.json

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
WORKDIR /app/apps/hub
CMD ["sh", "-c", "bun prisma db push && bun src/server.ts"]
