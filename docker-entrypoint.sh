#!/bin/sh
set -e

mkdir -p /data/uploads
chown -R node:node /data

# Run pending migrations before starting the server
su-exec node npx prisma migrate deploy

exec su-exec node "$@"
