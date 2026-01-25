FROM oven/bun:1

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Build admin frontend
RUN bun run build:admin

# Expose port
EXPOSE 51001

# Run server with hot reloading
CMD ["sh", "-c", "bun prisma generate && bun prisma db push && bun --watch src/server.ts"]
