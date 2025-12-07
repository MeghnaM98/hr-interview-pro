# syntax=docker/dockerfile:1.6

FROM node:20-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Provide a default SQLite path so Docker builds (which run without Render env vars)
# have a DATABASE_URL available. Render will override this at runtime.
# Use /data so the runtime user can create the file without needing to write into /app/.
ARG DATABASE_URL="file:/data/dev.db"
ENV DATABASE_URL=${DATABASE_URL}

RUN apk add --no-cache libc6-compat openssl bash

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

# Ensure the non-root user 'node' owns the application files
# This fixes the EACCES error by giving the 'node' user write permission
COPY --from=builder --chown=node:node /app/next.config.js ./next.config.js
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder --chown=node:node /app/resources ./resources

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

# Prepare the data directory and permissions
RUN chmod +x /usr/local/bin/docker-entrypoint.sh && \
    mkdir -p /data/uploads && \
    chown -R node:node /data && \
    chown -R node:node /app

VOLUME ["/data"]
EXPOSE 3000

# Switch to non-root user
USER node

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
