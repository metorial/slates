FROM oven/bun:1 AS base

# Install curl for health checks
RUN apt-get update && \
    apt-get install -y curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dependencies stage (production only)
FROM base AS deps

COPY package.json bun.lock* ./
COPY apps/registry/package.json ./apps/registry/package.json

RUN bun install --frozen-lockfile --production --filter slates-registry

# Dependencies stage (dev/test)
FROM base AS dev-deps

COPY package.json bun.lock* ./
COPY apps/registry/package.json ./apps/registry/package.json

RUN bun install --frozen-lockfile --filter slates-registry

# Build stage
FROM base AS builder

COPY package.json bun.lock* ./
COPY apps/registry/package.json ./apps/registry/package.json

RUN bun install --frozen-lockfile --filter slates-registry

COPY apps/registry/prisma ./apps/registry/prisma
COPY apps/registry/prisma.config.ts ./apps/registry/prisma.config.ts
COPY apps/registry/src ./apps/registry/src
COPY apps/registry/tsconfig.json ./apps/registry/tsconfig.json
COPY apps/registry/admin ./apps/registry/admin

RUN cd apps/registry && bun prisma generate
RUN cd apps/registry && bun run admin:build

# Production stage
FROM base AS runner

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY --from=builder /app/apps/registry/prisma/generated ./apps/registry/prisma/generated
COPY --from=builder /app/apps/registry/prisma ./apps/registry/prisma
COPY --from=builder /app/apps/registry/prisma.config.ts ./apps/registry/prisma.config.ts
COPY --from=builder /app/apps/registry/src ./apps/registry/src
COPY --from=builder /app/apps/registry/package.json ./apps/registry/package.json
COPY --from=builder /app/apps/registry/tsconfig.json ./apps/registry/tsconfig.json
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
CMD ["sh", "-c", "cd apps/registry && bun prisma db push && bun src/server.ts"]

# Dev stage for docker-compose
FROM base AS dev

WORKDIR /app

COPY --from=dev-deps /app/node_modules ./node_modules
COPY apps/registry ./apps/registry

CMD ["sh", "-c", "cd apps/registry && bun prisma generate && bun prisma db push && bun --watch src/server.ts"]
