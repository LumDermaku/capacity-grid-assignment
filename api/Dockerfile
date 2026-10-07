# Build stage: bundle and precompile to bytecode
FROM oven/bun:1.4.2-alpine AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun i:prod
COPY . .
RUN bun run build

FROM oven/bun:1.4.2-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/dist ./dist
# The schema is read from the .graphql files at startup.
COPY --from=builder /app/src/models ./src/models
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 8080
CMD ["bun", "dist/index.js"]
