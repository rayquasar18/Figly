FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

# --- Dependencies stage ---
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/
COPY packages/shared/package.json ./packages/shared/
# Copy Prisma schema for postinstall prisma generate
COPY backend/prisma/schema.prisma ./backend/prisma/schema.prisma
RUN pnpm install --frozen-lockfile

# --- Builder stage ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY . .
# Ensure public dir exists (may be empty)
RUN mkdir -p frontend/public
# Build shared first (frontend depends on shared types)
RUN pnpm --filter @figly/shared build
# Build frontend with standalone output
ARG NEXT_PUBLIC_API_URL=http://localhost:4000/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm --filter @figly/frontend build

# --- Runner stage ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/frontend/.next/standalone ./
COPY --from=builder /app/frontend/.next/static ./frontend/.next/static
COPY --from=builder /app/frontend/public ./frontend/public

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "frontend/server.js"]
