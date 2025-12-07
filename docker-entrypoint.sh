#!/bin/sh
set -e

mkdir -p /data/uploads

# Run pending migrations before starting the server
npx prisma migrate deploy

exec "$@"
