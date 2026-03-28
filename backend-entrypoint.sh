#!/bin/sh
set -e

echo "=== Figly Backend Starting ==="

# Push schema to database (idempotent)
echo "Pushing Prisma schema..."
cd /app/backend
npx prisma db push --skip-generate --accept-data-loss

# Seed database (idempotent)
echo "Seeding database..."
npx prisma db seed || true

echo "Starting backend on :${PORT:-4000}..."
exec node dist/main.js
