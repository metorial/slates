FROM oven/bun:1

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Expose port
EXPOSE 51001

# Run server with hot reloading (admin is built on host and mounted)
CMD ["sh", "-c", "bun prisma db push && bun --watch src/server.ts"]
