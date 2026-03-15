FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

WORKDIR /app

# Copy workspace root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy all packages
COPY packages/shared ./packages/shared
COPY backend ./backend
COPY frontend ./frontend

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN cd backend && npx prisma generate

# Build everything (shared -> backend + frontend)
RUN pnpm turbo build

EXPOSE 3000 4000

# Start script runs both backend and frontend
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

CMD ["/app/docker-entrypoint.sh"]
