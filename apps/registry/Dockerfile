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
COPY apps/registry/prisma ./apps/registry/prisma
COPY apps/registry/prisma.config.ts ./apps/registry/prisma.config.ts

# Generate Prisma client
WORKDIR /app/apps/registry
RUN bun prisma generate

# Copy source code
COPY apps/registry/src ./src
COPY apps/registry/tsconfig.json ./tsconfig.json

# Copy admin panel source and build
COPY apps/registry/admin ./admin
RUN bun run admin:build

# Production stage
FROM base AS runner

WORKDIR /app

# Copy dependencies from deps stage

# Copy generated Prisma client from builder
COPY --from=builder /app/apps/registry/prisma/generated ./apps/registry/prisma/generated

# Copy Prisma schema (needed for db push)
COPY --from=builder /app/apps/registry/prisma ./apps/registry/prisma
COPY --from=builder /app/apps/registry/prisma.config.ts ./apps/registry/prisma.config.ts

# Copy source code
COPY --from=builder /app/apps/registry/src ./apps/registry/src
COPY --from=builder /app/apps/registry/package.json ./apps/registry/package.json
COPY --from=builder /app/apps/registry/tsconfig.json ./apps/registry/tsconfig.json

# Copy built admin panel
COPY --from=builder /app/apps/registry/dist/admin ./apps/registry/dist/admin

# Create non-root user for security
RUN groupadd -r metorial && useradd -r -g metorial metorial && \
    chown -R metorial:metorial /app

USER metorial

# Expose ports
EXPOSE 52040
EXPOSE 52041
EXPOSE 52042

# Health check using curl
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
    CMD curl -f http://localhost:52040/ping && \
    curl -f http://localhost:52041/ping || exit 1

# Start command: push schema and start service
WORKDIR /app/apps/registry
CMD ["sh", "-c", "bun prisma db push && bun src/server.ts"]
