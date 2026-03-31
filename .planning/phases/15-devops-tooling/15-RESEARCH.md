# Phase 15: DevOps & Tooling - Research

**Researched:** 2026-03-25
**Domain:** ESLint/Prettier, Git hooks, CI/CD (GitHub Actions), Docker containerization
**Confidence:** HIGH

## Summary

Phase 15 introduces four pillars of developer experience and deployment infrastructure to the Figly monorepo: (1) ESLint + Prettier for consistent code formatting across all three workspaces, (2) Husky + lint-staged for pre-commit quality gates, (3) GitHub Actions CI/CD pipeline for automated checks on push/PR, and (4) splitting the current single-container Docker setup into two separate containers (figly-frontend, figly-backend).

The codebase currently has zero linting configuration -- no ESLint, no Prettier, no `.eslintrc` or `eslint.config.mjs` in any workspace. Both `backend/package.json` and `packages/shared/package.json` have stub `"lint": "echo 'lint ok'"` scripts. Frontend has `"lint": "eslint ."` but no ESLint installed. The existing Docker setup is a single container running both frontend and backend via a shell entrypoint script. There is no `.github/` directory.

**Primary recommendation:** Use ESLint 9 flat config (`eslint.config.mjs`) with `eslint-config-next@16.2.1` for frontend and `typescript-eslint` for backend/shared. Use Husky 9 + lint-staged 16. Single GitHub Actions workflow with parallel jobs. Multi-stage Dockerfiles with Next.js `output: 'standalone'` for frontend and minimal NestJS dist for backend.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** 2 separate Dockerfiles -- `frontend/Dockerfile` and `backend/Dockerfile`, each self-contained
- **D-02:** Update existing `docker-compose.yml` -- replace single `app` service with `figly-frontend` + `figly-backend` services. Keep postgres/redis/minio as-is
- **D-03:** Next.js standalone output mode -- minimal production image (~150MB), no full node_modules
- **D-04:** Runtime env + Docker internal network -- `NEXT_PUBLIC_API_URL` set via Docker env, backend reachable at `http://figly-backend:4000/api` within Docker network
- **D-05:** Frontend exposes port 3000, backend exposes port 4000 (unchanged from current setup)
- **D-06:** Remove old root `Dockerfile` and `docker-entrypoint.sh` after new setup is verified
- Docker containers must be named `figly-frontend` and `figly-backend` per user preference (from memory)
- Always rebuild and test Docker after changes (user feedback)

### Claude's Discretion
- ESLint flat config vs legacy .eslintrc -- decide based on ecosystem best practice
- ESLint rule strictness level -- enforce strict but auto-fixable rules
- Prettier config details -- match existing conventions from CONVENTIONS.md
- How to handle existing violations -- auto-fix what's possible, suppress remaining
- Whether to add eslint-plugin-import for import ordering
- Husky + lint-staged configuration details
- What runs on pre-commit: lint-staged with ESLint --fix + Prettier --write
- Whether to include type-check in pre-commit (slower) or only in CI
- GitHub Actions workflow structure (single vs matrix)
- Pipeline steps: lint, type-check, build, test on push to develop + PRs
- Whether to add Docker build verification in CI
- Branch protection rules configuration
- Cache strategy for pnpm dependencies and Turbo cache

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DEVP-01 | ESLint + Prettier configured with consistent rules across frontend, backend, shared | Standard Stack section: ESLint 9 flat config + Prettier 3.8 + eslint-config-next + typescript-eslint. Architecture Patterns: per-workspace configs with shared base. |
| DEVP-02 | Husky + lint-staged runs linting on pre-commit | Standard Stack: Husky 9.1.7 + lint-staged 16.4.0. Code Examples: hook configuration, lint-staged patterns per workspace. |
| DEVP-03 | CI/CD pipeline via GitHub Actions (lint, type-check, build, test) | Architecture Patterns: workflow structure with parallel jobs, pnpm + turbo cache strategy. Code Examples: complete workflow YAML. |
| DEVP-04 | Docker split into 2 separate containers (figly-frontend, figly-backend) | Architecture Patterns: multi-stage Dockerfiles, standalone mode, monorepo tracing. Code Examples: Dockerfile patterns for Next.js and NestJS. |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| eslint | ^9.39.0 | JavaScript/TypeScript linter | ESLint 9 is current stable; flat config is default. ESLint 10 just released but ecosystem plugins not yet fully aligned. |
| @eslint/js | ^9.27.0 | ESLint recommended rules | Official base ruleset for flat config |
| typescript-eslint | ^8.57.0 | TypeScript ESLint integration | Unified package for parser + plugin in flat config. Required by eslint-config-next@16. |
| eslint-config-next | 16.2.1 | Next.js specific ESLint rules | Matches installed Next.js version. Includes react, react-hooks, jsx-a11y, import plugins. Supports flat config. |
| eslint-config-prettier | ^10.1.0 | Disables ESLint rules that conflict with Prettier | Prevents ESLint/Prettier formatting conflicts |
| eslint-plugin-prettier | ^5.5.0 | Runs Prettier as ESLint rule | Reports Prettier violations as ESLint errors for unified workflow |
| prettier | ^3.8.0 | Code formatter | Industry standard. Opinionated, zero-debate formatting. |
| prettier-plugin-tailwindcss | ^0.7.0 | Sorts Tailwind CSS classes | Official Tailwind plugin. Auto-sorts utility classes. |
| husky | ^9.1.7 | Git hooks manager | Lightweight, native Git hooks. v9 simplified setup (just shell files in .husky/). |
| lint-staged | ^16.4.0 | Run linters on staged files | Prevents running lint on entire codebase during commit. Fast feedback. |
| globals | ^17.4.0 | Global variable definitions for ESLint | Provides browser/node/jest globals for flat config |

### Supporting (CI/CD -- no npm packages)

| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| GitHub Actions | v4 | CI/CD pipeline | Every push to develop, every PR |
| actions/checkout | v4 | Checkout code | Every workflow |
| pnpm/action-setup | v4 | Install pnpm | Every workflow |
| actions/setup-node | v4 | Setup Node.js with caching | Every workflow |
| actions/cache | v4 | Cache turbo artifacts | Build speed optimization |
| Docker multi-stage | -- | Production images | Deployment |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ESLint 9 | ESLint 10 | ESLint 10 just released (10.1.0). `eslint-config-next` supports `>=9.0.0` so 10 would work, but ecosystem stability favors 9 for now. Can upgrade later. |
| eslint-plugin-prettier | Prettier separately | Running Prettier as ESLint rule gives unified error reporting. Alternative: run Prettier standalone in lint-staged. Plugin approach chosen for single `eslint --fix` command. |
| Husky | simple-git-hooks | simple-git-hooks is zero-dependency but less flexible. Husky is the ecosystem standard with better monorepo support. |
| lint-staged | nano-staged | nano-staged is smaller but less maintained. lint-staged is battle-tested with 16.x release. |

**Discretion decision -- ESLint flat config:** Use `eslint.config.mjs` (flat config). This is the default since ESLint 9, the legacy `.eslintrc` format is deprecated. The NestJS 11 schematics template already uses flat config. eslint-config-next@16 exports flat config compatible format.

**Discretion decision -- eslint-plugin-import:** Do NOT add separately. `eslint-config-next@16.2.1` already bundles `eslint-plugin-import@^2.32.0` as a dependency. Import ordering is handled by the Next.js config. Adding a separate import plugin would create conflicts.

**Installation:**

Root (shared dev dependencies):
```bash
pnpm add -Dw eslint@^9.39.0 @eslint/js@^9.27.0 prettier@^3.8.0 eslint-config-prettier@^10.1.0 eslint-plugin-prettier@^5.5.0 globals@^17.4.0 husky@^9.1.7 lint-staged@^16.4.0
```

Frontend:
```bash
pnpm add -D --filter @figly/frontend eslint-config-next@16.2.1 typescript-eslint@^8.57.0 prettier-plugin-tailwindcss@^0.7.0
```

Backend:
```bash
pnpm add -D --filter @figly/backend typescript-eslint@^8.57.0
```

Shared:
```bash
pnpm add -D --filter @figly/shared typescript-eslint@^8.57.0
```

## Architecture Patterns

### Recommended Project Structure (new files)

```
.
├── .prettierrc                     # Root Prettier config (shared by all workspaces)
├── .prettierignore                 # Ignore node_modules, dist, .next, coverage
├── frontend/
│   ├── Dockerfile                  # NEW: Multi-stage frontend Dockerfile
│   └── eslint.config.mjs          # NEW: Next.js + TypeScript + Prettier rules
├── backend/
│   ├── Dockerfile                  # NEW: Multi-stage backend Dockerfile
│   └── eslint.config.mjs          # NEW: NestJS + TypeScript + Prettier rules
├── packages/shared/
│   └── eslint.config.mjs          # NEW: TypeScript + Prettier rules (minimal)
├── .husky/
│   └── pre-commit                 # NEW: lint-staged runner
├── .github/
│   └── workflows/
│       └── ci.yml                 # NEW: CI/CD pipeline
├── Dockerfile                      # DELETE after verification
└── docker-entrypoint.sh            # DELETE after verification
```

### Pattern 1: Per-Workspace ESLint Flat Config

**What:** Each workspace gets its own `eslint.config.mjs` because they have different environments (browser vs Node.js), different plugins (Next.js vs NestJS), and different TypeScript configs.

**When to use:** Always in monorepos with heterogeneous workspaces.

**Frontend `eslint.config.mjs`:**
```javascript
// @ts-check
import { FlatCompat } from '@eslint/eslintrc';
import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

export default tseslint.config(
  { ignores: ['.next/**', 'node_modules/**'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...compat.extends('next/core-web-vitals'),
  eslintConfigPrettier,
  eslintPluginPrettier,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'prettier/prettier': 'error',
    },
  },
);
```

**Note on eslint-config-next and flat config:** `eslint-config-next@16` exports flat-config compatible modules. However, the package may still use the legacy format internally. Use `@eslint/eslintrc` `FlatCompat` to bridge if direct import fails. The `FlatCompat` approach is well-established and the official migration path documented by ESLint.

**Backend `eslint.config.mjs`:**
```javascript
// @ts-check
import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  eslintPluginPrettier,
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
      sourceType: 'commonjs',
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-require-imports': 'off',
      'prettier/prettier': 'error',
    },
  },
);
```

**Shared `eslint.config.mjs`:**
```javascript
// @ts-check
import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  eslintPluginPrettier,
  {
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'prettier/prettier': 'error',
    },
  },
);
```

### Pattern 2: Root Prettier Config

**What:** Single `.prettierrc` at repo root, inherited by all workspaces.

**Config matching existing conventions (from CONVENTIONS.md):**
```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "endOfLine": "auto",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

**`.prettierignore`:**
```
node_modules
dist
.next
.turbo
coverage
pnpm-lock.yaml
packages/shared/dist
```

### Pattern 3: Multi-Stage Docker Build (Frontend)

**What:** Next.js standalone mode with multi-stage build for minimal production image.

**Key configuration in `next.config.js`:**
```javascript
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@figly/shared'],
  // In monorepo, trace from root to include shared package
  outputFileTracingRoot: path.join(__dirname, '../'),
};

module.exports = nextConfig;
```

**`frontend/Dockerfile` pattern:**
```dockerfile
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
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY . .
# Build shared first, then frontend
RUN pnpm --filter @figly/shared build
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
```

### Pattern 4: Multi-Stage Docker Build (Backend)

**`backend/Dockerfile` pattern:**
```dockerfile
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
RUN pnpm --filter @figly/shared build
RUN pnpm --filter @figly/backend build

# --- Runner stage ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache ffmpeg
# sharp and argon2 need native binaries
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./node_modules/@figly/shared/dist
COPY --from=builder /app/packages/shared/package.json ./node_modules/@figly/shared/package.json
COPY --from=builder /app/backend/prisma ./prisma
COPY --from=builder /app/backend/package.json ./package.json

EXPOSE 4000
ENV PORT=4000
CMD ["node", "dist/main.js"]
```

### Pattern 5: GitHub Actions CI Workflow

**What:** Single workflow file with parallel jobs for lint, type-check, build, test.

**`.github/workflows/ci.yml` structure:**
```yaml
name: CI
on:
  push:
    branches: [develop]
  pull_request:
    branches: [develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo build --filter=@figly/shared
      - run: pnpm --filter @figly/frontend exec tsc --noEmit
      - run: pnpm --filter @figly/backend exec tsc --noEmit

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm test
```

### Pattern 6: Docker Compose Update

**What:** Replace single `app` service with `figly-frontend` + `figly-backend`, add internal network.

```yaml
  figly-backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    container_name: figly-backend
    restart: unless-stopped
    ports:
      - "4000:4000"
    environment:
      DATABASE_URL: postgresql://figly:figly_dev@figly-postgres:5432/figly
      REDIS_URL: redis://figly-redis:6379
      # ... other env vars
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      minio-init:
        condition: service_completed_successfully
    networks:
      - figly-net

  figly-frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
    container_name: figly-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://figly-backend:4000/api
    depends_on:
      - figly-backend
    networks:
      - figly-net

networks:
  figly-net:
    driver: bridge
```

### Anti-Patterns to Avoid

- **Root-level ESLint config for all workspaces:** Each workspace has different environment (browser/node), different plugins, and different tsconfig. A single root config would require complex overrides and break type-aware rules.
- **Type-checking in pre-commit hooks:** TypeScript type-check on a monorepo takes 10-30 seconds. This kills developer flow. Run type-check only in CI.
- **`eslint .` from root without turbo:** Would lint all workspaces sequentially with potential config confusion. Use `pnpm lint` (which runs `turbo lint`) to leverage workspace-specific configs.
- **Copying full `node_modules` into Docker runner stage:** Defeats the purpose of standalone mode. Only copy `.next/standalone` for frontend, `dist/` + production node_modules for backend.
- **Running `prisma db push` in Dockerfile:** Database migrations should be separate from container build. Run as init container or entrypoint step, not during build.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Git hook management | Shell scripts in `.git/hooks/` | Husky 9 | Git hooks aren't version-controlled by default. Husky creates portable hook scripts in `.husky/` that are committed. |
| Staged file filtering | Custom script to find staged TS files | lint-staged 16 | Handles partial staging, binary files, concurrent operations, and respects `.gitignore`. |
| CI dependency caching | Manual cache key management | `pnpm/action-setup` + `actions/setup-node` with `cache: 'pnpm'` | Automatic lockfile-based cache key. pnpm's content-addressable store is cache-friendly. |
| ESLint config inheritance | Custom config merging logic | `typescript-eslint` `config()` helper | `tseslint.config()` provides type-safe, composable flat config merging. |
| Docker build optimization | Single-stage Dockerfile | Multi-stage builds | Separates build dependencies from runtime. Final image has only production artifacts. |
| Tailwind class sorting | Manual class ordering conventions | prettier-plugin-tailwindcss | Automatic, deterministic class ordering on every format. |

**Key insight:** Every tool in this phase is a mature, well-maintained solution to a problem that seems simple but has critical edge cases (git hook portability, staged file detection, Docker layer caching, ESLint config resolution in monorepos).

## Common Pitfalls

### Pitfall 1: ESLint Flat Config and eslint-config-next Compatibility

**What goes wrong:** `eslint-config-next` has historically used the legacy `.eslintrc` format internally. When importing directly in flat config, it may fail.
**Why it happens:** The transition from legacy to flat config is ongoing. Some configs export both formats, some need bridging.
**How to avoid:** Use `@eslint/eslintrc` `FlatCompat` to bridge the Next.js config if direct import fails. The FlatCompat wrapper is officially supported. Test the import approach first: `import nextConfig from 'eslint-config-next'` -- if it exports a flat config array, use directly. Otherwise, use FlatCompat.
**Warning signs:** `ESLint configuration in <file> is invalid` errors mentioning "keys" or "extends".

### Pitfall 2: Next.js Standalone Mode in Monorepo

**What goes wrong:** Standalone output traces from the workspace root by default. In a monorepo, files from `packages/shared` won't be included in the trace.
**Why it happens:** Next.js traces from the `next.config.js` directory. Shared package code is above this directory.
**How to avoid:** Set `outputFileTracingRoot: path.join(__dirname, '../')` in `next.config.js` to trace from the monorepo root. This ensures shared package code and any hoisted dependencies are included.
**Warning signs:** Runtime errors about missing modules from `@figly/shared` in the Docker container.

### Pitfall 3: pnpm Hoisting and Docker COPY

**What goes wrong:** pnpm uses a content-addressable store with symlinks. Docker `COPY` resolves symlinks, which can break the dependency structure or miss dependencies.
**Why it happens:** pnpm's node_modules structure is fundamentally different from npm/yarn. `node_modules/.pnpm/` is the real store; top-level entries are symlinks.
**How to avoid:** Always use `pnpm install --frozen-lockfile` inside Docker (not copy node_modules from host). For the backend runner stage, copy the workspace-specific `node_modules` which pnpm resolves correctly during install.
**Warning signs:** `Module not found` errors in Docker that don't occur locally.

### Pitfall 4: `NEXT_PUBLIC_` Env Vars are Build-Time

**What goes wrong:** Setting `NEXT_PUBLIC_API_URL` as a Docker runtime env var has no effect because Next.js inlines these at build time.
**Why it happens:** Next.js replaces `process.env.NEXT_PUBLIC_*` with literal values during `next build`. Runtime env vars are only for server-side `process.env.*`.
**How to avoid:** For the Docker setup, either: (a) pass the env var as a build arg during `docker build`, or (b) use a runtime configuration approach (e.g., `publicRuntimeConfig` or a `/api/config` endpoint). Since the Docker network uses a fixed hostname (`figly-backend`), building with the correct value via build arg is simplest.
**Warning signs:** Frontend calls going to `localhost:4000` instead of `figly-backend:4000` inside Docker network.

### Pitfall 5: Native Dependencies in Alpine Docker

**What goes wrong:** Packages like `sharp`, `argon2`, `bcrypt` require native binaries compiled for the target platform.
**Why it happens:** These packages include platform-specific binary addons. The binary from the build stage may not work if build and run stages use different base images.
**How to avoid:** Use the same base image (`node:20-alpine`) for both build and run stages. For the backend, copy `node_modules` from the build stage (which compiled native addons for Alpine). Sharp and argon2 both support Alpine via pre-built musl binaries.
**Warning signs:** `Error: Cannot find module` or `Error: /lib/x86_64-linux-gnu/libc.so.6: version 'GLIBC_X.XX' not found`.

### Pitfall 6: lint-staged Running on Entire Codebase

**What goes wrong:** Misconfigured lint-staged glob patterns match files outside the staged set, or ESLint configs don't resolve correctly when lint-staged runs from root.
**Why it happens:** lint-staged runs from the git root. ESLint config resolution depends on the file's location relative to the nearest `eslint.config.mjs`.
**How to avoid:** Use workspace-relative glob patterns in lint-staged config. ESLint 9 flat config resolves based on the config file location, so each workspace's `eslint.config.mjs` handles its own files correctly.
**Warning signs:** Lint errors from unrelated workspaces, or config resolution errors during commit.

### Pitfall 7: Prisma Generate in Docker Backend

**What goes wrong:** Backend fails to start in Docker because Prisma client was not generated.
**Why it happens:** `@prisma/client` needs `prisma generate` to create the client code specific to the schema. The `postinstall` script handles this locally, but in Docker multi-stage builds the context may differ.
**How to avoid:** Explicitly run `npx prisma generate` in the builder stage after installing dependencies and before building. Also copy the generated Prisma client to the runner stage.
**Warning signs:** `PrismaClientInitializationError` or `@prisma/client did not initialize yet` in Docker.

## Code Examples

### Prettier Config (`.prettierrc`)
```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "endOfLine": "auto",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### Husky Setup Commands
```bash
# Initialize husky (creates .husky/ directory)
pnpm exec husky init

# The init command creates .husky/pre-commit with a default script
# Replace its content with lint-staged:
echo "pnpm exec lint-staged" > .husky/pre-commit
```

### lint-staged Config (root `package.json` or `.lintstagedrc.json`)
```json
{
  "frontend/**/*.{ts,tsx}": [
    "eslint --fix --no-warn-ignored",
    "prettier --write"
  ],
  "backend/**/*.ts": [
    "eslint --fix --no-warn-ignored",
    "prettier --write"
  ],
  "packages/shared/**/*.ts": [
    "eslint --fix --no-warn-ignored",
    "prettier --write"
  ],
  "*.{json,md,yml,yaml}": [
    "prettier --write"
  ]
}
```

### Workspace lint Scripts

Each workspace needs a real `lint` script (replacing the stubs):

**frontend/package.json:**
```json
{
  "scripts": {
    "lint": "eslint ."
  }
}
```

**backend/package.json:**
```json
{
  "scripts": {
    "lint": "eslint ."
  }
}
```

**packages/shared/package.json:**
```json
{
  "scripts": {
    "lint": "eslint ."
  }
}
```

### Handling Existing Violations Strategy

The codebase has ~265 TypeScript files with no prior linting. Strategy:
1. Run `prettier --write` across entire codebase first to normalize formatting
2. Run `eslint --fix` to auto-fix what's possible
3. For remaining violations, use `'warn'` level for non-critical rules (e.g., `no-explicit-any`)
4. Use `'off'` for rules that would require major refactoring (e.g., type-checked rules that need per-file type info)
5. Zero violations target: all rules either auto-fixed, set to warn, or off. No `eslint-disable` comments needed.

### Discretion Decision: Pre-commit Scope

**Decision: Do NOT include type-check in pre-commit.**

Rationale:
- `tsc --noEmit` on the full monorepo takes 10-30 seconds
- Pre-commit should complete in < 5 seconds for good developer experience
- lint-staged only runs on staged files -- type-check needs the full project context
- Type-check is covered in CI (runs on every push/PR)

Pre-commit runs: `lint-staged` (ESLint --fix + Prettier --write on staged files only).

### Discretion Decision: CI Workflow Structure

**Decision: Single workflow file with parallel jobs.**

Rationale:
- Parallel jobs (`lint`, `typecheck`, `build`, `test`) run simultaneously
- Each job installs independently with pnpm cache (fast due to content-addressable store)
- Faster total CI time vs sequential steps in one job
- Clear failure identification (know exactly which step failed)
- Docker build verification: Include as optional/separate job -- not blocking for now since Docker changes need manual testing

### Discretion Decision: CI Cache Strategy

**Decision: Use `actions/setup-node` with `cache: 'pnpm'` for dependency caching. Use `actions/cache` for Turbo build cache.**

```yaml
- uses: actions/cache@v4
  with:
    path: .turbo
    key: turbo-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}-${{ github.sha }}
    restore-keys: |
      turbo-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}-
      turbo-${{ runner.os }}-
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `.eslintrc.js` (legacy config) | `eslint.config.mjs` (flat config) | ESLint 9.0 (2024-04) | Flat config is default. Legacy format deprecated. |
| Husky v4 (`.huskyrc`) | Husky v9 (shell files in `.husky/`) | Husky 9.0 (2024-01) | Simpler setup: just shell scripts. No JSON config. |
| `next lint` (Next.js built-in) | ESLint CLI with eslint-config-next | Next.js 16 | `next lint` still works but manual ESLint gives more control in monorepo. |
| `output: 'standalone'` + manual cp | Same (no change) | -- | Next.js standalone is mature and stable. Monorepo needs `outputFileTracingRoot`. |
| Docker single container | Docker multi-container | Industry trend | Independent scaling, separate health checks, isolated failure domains. |

**Deprecated/outdated:**
- `.eslintrc.*` format: Deprecated in ESLint 9. Will be removed in ESLint 10.
- Husky v4 `.huskyrc.json`: Replaced by shell scripts in `.husky/` directory.
- `lint-staged` v12 config in `package.json` with function syntax: v16 uses the same config format but with improved performance.

## Open Questions

1. **NEXT_PUBLIC_API_URL in Docker build**
   - What we know: `NEXT_PUBLIC_*` vars are inlined at build time. Docker runtime env won't work for client-side code.
   - What's unclear: Whether the frontend needs server-to-server communication (SSR) vs client-only API calls. SSR would use a server-side env var, client would need build-time value.
   - Recommendation: Use Docker build arg for `NEXT_PUBLIC_API_URL`. For server-side rendering within Docker network, add a separate `API_URL` (non-public) env var that resolves to `http://figly-backend:4000/api`. The existing `fetchApi` pattern in the codebase can check for server-side env var first.

2. **Backend Prisma migration in Docker**
   - What we know: Current entrypoint runs `prisma db push --accept-data-loss` on every start.
   - What's unclear: Whether this should be in the backend Dockerfile entrypoint or as a separate init container.
   - Recommendation: Add a simple entrypoint script to the backend container that runs `prisma db push` before `node dist/main.js`. This matches the current behavior.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All | Yes | v25.8.0 (local); 20 Alpine (Docker) | -- |
| pnpm | All | Yes | 9.15.9 | -- |
| Docker | DEVP-04 | Yes | 29.2.1 | -- |
| Docker Compose | DEVP-04 | Yes | v5.0.2 | -- |
| gh (GitHub CLI) | DEVP-03 (branch protection) | Yes | 2.88.1 | -- |
| git | DEVP-02 (hooks) | Yes | (system) | -- |
| ffmpeg | Backend Docker image | Needs `apk add` in Docker | -- | -- |

**Missing dependencies with no fallback:** None -- all tools available.

**Missing dependencies with fallback:** None.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 29.7 (backend only) |
| Config file | `backend/jest.config.ts` |
| Quick run command | `pnpm --filter @figly/backend test` |
| Full suite command | `pnpm test` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DEVP-01 | ESLint + Prettier produce zero violations | smoke | `pnpm lint` (runs turbo lint across all workspaces) | N/A -- config test, not code test |
| DEVP-02 | Pre-commit hook blocks violations | manual | Manually stage a file with violation and attempt commit | N/A -- hook behavior |
| DEVP-03 | CI pipeline passes on clean code | smoke | `pnpm lint && pnpm --filter @figly/frontend exec tsc --noEmit && pnpm --filter @figly/backend exec tsc --noEmit && pnpm build && pnpm test` | N/A -- CI workflow test |
| DEVP-04 | Docker containers build and start | smoke | `docker compose build && docker compose up -d figly-frontend figly-backend && docker compose ps` | N/A -- Docker verification |

### Sampling Rate

- **Per task commit:** `pnpm lint` (quick: lint only changed workspace)
- **Per wave merge:** `pnpm lint && pnpm build && pnpm test`
- **Phase gate:** Full CI simulation locally + Docker build + Docker compose up test

### Wave 0 Gaps

- None -- this phase is infrastructure/configuration, not application code. Existing backend tests (`pnpm test`) validate that linting config doesn't break test execution. Docker verification is manual.

## Sources

### Primary (HIGH confidence)
- npm registry -- verified all package versions via `npm view` (eslint 9.39.4, prettier 3.8.1, husky 9.1.7, lint-staged 16.4.0, typescript-eslint 8.57.2, eslint-config-next 16.2.1, eslint-config-prettier 10.1.8, eslint-plugin-prettier 5.5.5, globals 17.4.0, prettier-plugin-tailwindcss 0.7.2)
- Next.js official docs (v16.2.1) -- `output: 'standalone'`, `outputFileTracingRoot` for monorepo, Docker deployment guidance
- NestJS 11 schematics template -- flat config ESLint pattern (verified in local node_modules)
- eslint-config-next@16.2.1 -- verified peer deps (`eslint: '>=9.0.0'`), dependencies (typescript-eslint ^8.46.0, globals 16.4.0, react/jsx-a11y/import plugins)
- Project codebase -- direct inspection of all config files, package.json scripts, Docker setup, tsconfig files

### Secondary (MEDIUM confidence)
- ESLint flat config migration -- based on ESLint 9 being default flat config, verified by NestJS schematics template using `eslint.config.mjs`
- FlatCompat approach for eslint-config-next -- standard ESLint migration pattern, may not be needed if eslint-config-next@16 exports flat config directly

### Tertiary (LOW confidence)
- None -- all findings verified against npm registry or local codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all versions verified via `npm view`, peer dependencies confirmed compatible
- Architecture: HIGH -- patterns based on official docs (Next.js standalone, NestJS schematics, ESLint flat config) and verified project structure
- Pitfalls: HIGH -- based on known monorepo challenges with pnpm/Docker/ESLint, verified against project's actual configuration
- Docker: MEDIUM -- Next.js standalone in monorepo with `outputFileTracingRoot` needs runtime validation; the exact COPY paths in multi-stage build may need adjustment during implementation

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (30 days -- stable ecosystem, no fast-moving changes expected)
