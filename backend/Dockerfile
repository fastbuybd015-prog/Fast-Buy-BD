FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source files
COPY . .

# Environment setup
ENV NODE_ENV=production
ENV HOST=0.0.0.0

EXPOSE 4000

CMD ["bun", "src/server.ts"]
