FROM oven/bun:1 AS base

# Install curl for health checks
RUN apt-get update && \
    apt-get install -y curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dependencies stage
FROM base AS deps

# Copy package files
COPY package.json bun.lock* ./
COPY apps/hub/package.json ./apps/hub/package.json

# Install dependencies (production only)
RUN bun install --frozen-lockfile --production --filter slates-hub

# Build stage
FROM base AS builder

# Copy package files
COPY package.json bun.lock* ./
COPY apps/hub/package.json ./apps/hub/package.json

# Install all dependencies (including devDependencies for Prisma generation)
RUN bun install --frozen-lockfile --filter slates-hub

# Copy Prisma schema
COPY apps/hub/prisma ./apps/hub/prisma
COPY apps/hub/prisma.config.ts ./apps/hub/prisma.config.ts

# Generate Prisma client
RUN cd apps/hub && bun prisma generate

# Copy source code
COPY apps/hub/src ./apps/hub/src
COPY apps/hub/tsconfig.json ./apps/hub/tsconfig.json

# Production stage
FROM base AS runner

WORKDIR /app

# Ensure curl is present for health checks
RUN apt-get update && \
    apt-get install -y curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

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
CMD ["sh", "-c", "cd apps/hub && bun prisma db push && bun src/server.ts"]

# Dependencies stage (dev/test)
FROM base AS dev-deps

COPY package.json bun.lock* ./
COPY apps/hub/package.json ./apps/hub/package.json

RUN bun install --frozen-lockfile --filter slates-hub

# Dev/test stage for docker-compose and CI e2e
FROM base AS test

WORKDIR /app

COPY --from=dev-deps /app/node_modules ./node_modules
COPY apps/hub ./apps/hub
COPY clients/hub ./clients/hub

CMD ["sh", "-c", "cd apps/hub && bun prisma generate && bun prisma db push --accept-data-loss && tail -f /dev/null"]
