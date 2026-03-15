#!/bin/sh
set -e

echo "=== Figly Starting ==="

# Push schema to database (idempotent)
cd /app/backend
echo "Pushing Prisma schema..."
npx prisma db push --skip-generate --accept-data-loss

# Seed database (idempotent)
echo "Seeding database..."
npx prisma db seed || true

# Start backend in background (use BACKEND_PORT to avoid conflict with Next.js reading PORT)
echo "Starting backend on :${BACKEND_PORT:-4000}..."
PORT=${BACKEND_PORT:-4000} node dist/main &
BACKEND_PID=$!

# Start frontend on port 3000
cd /app/frontend
echo "Starting frontend on :3000..."
PORT=3000 pnpm start &
FRONTEND_PID=$!

echo "=== Figly Ready ==="
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:${BACKEND_PORT:-4000}"

# Wait for either process to exit
wait -n $BACKEND_PID $FRONTEND_PID

# If one dies, kill the other
kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
wait
