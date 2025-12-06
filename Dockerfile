# syntax=docker/dockerfile:1.6

FROM node:20-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Provide a default SQLite path so Docker builds (which run without Render env vars)
# have a DATABASE_URL available. Render will override this at runtime.
# Use /data so the runtime user can create the file without needing to write into /app/.
ARG DATABASE_URL="file:/data/dev.db"
ENV DATABASE_URL=${DATABASE_URL}

RUN apk add --no-cache libc6-compat openssl bash su-exec

FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci

RUN mkdir -p /data && chown -R node:node /data

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production

# Install only production dependencies
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci --omit=dev

COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/.next ./.next
# Public assets are copied as part of the build output in /.next/static.
# The base image already contains an empty /app/public directory, so this
# copy step is not required and fails when the builder stage prunes it.
COPY --from=builder /app/resources ./resources

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh && \
    mkdir -p /data/uploads && \
    chown -R node:node /data

VOLUME ["/data"]
EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
