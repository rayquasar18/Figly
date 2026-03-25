FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

# --- Dependencies stage ---
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

# --- Builder stage ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY . .
# Build shared first
RUN pnpm --filter @figly/shared build
# Generate Prisma client
RUN cd backend && npx prisma generate
# Build backend
RUN pnpm --filter @figly/backend build

# --- Runner stage ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# ffmpeg needed for video processing
RUN apk add --no-cache ffmpeg

# Copy built backend
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./node_modules/@figly/shared/dist
COPY --from=builder /app/packages/shared/package.json ./node_modules/@figly/shared/package.json
COPY --from=builder /app/backend/prisma ./prisma
COPY --from=builder /app/backend/package.json ./package.json

EXPOSE 4000
ENV PORT=4000

# Run prisma db push then start the app
CMD ["sh", "-c", "npx prisma db push --skip-generate --accept-data-loss && npx prisma db seed || true && node dist/main.js"]
