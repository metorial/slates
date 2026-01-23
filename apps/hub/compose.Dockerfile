FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lock* ./
COPY packages ./packages
COPY clients ./clients
COPY apps/hub/package.json ./apps/hub/package.json

RUN bun install

COPY . .

RUN cd apps/hub && bun prisma generate

CMD ["sh", "-c", "cd apps/hub && bun prisma db push --accept-data-loss && tail -f /dev/null"]
