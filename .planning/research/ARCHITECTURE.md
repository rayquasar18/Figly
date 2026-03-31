# Architecture Research — v2.0 Directory Structure

**Researched:** 2026-03-20

## Target Frontend (Next.js 15+)
- `src/features/{domain}/` — components, hooks, stores per feature
- `src/components/ui/` — shadcn (keep as-is)
- `src/components/layout/` — shared layout
- `src/lib/` — api-client, server-fetch, query-client, utils
- `src/app/(public)/` — Server Components for SEO
- `src/middleware.ts` — auth redirects

## Target Backend (NestJS 11)
- `src/common/` — filters, guards, interceptors, decorators, pipes
- `src/config/` — configuration, env validation, swagger config
- `src/health/` — health check module
- Move guards from auth/ to common/

## Target Shared Package
- Rename `dto/` → `schemas/` for clarity
- Remove dist/ from git (build artifact)
- Keep: schemas, types, constants, validators

## Migration Order
1. Framework upgrades (React 19, Next.js 16, NestJS 11)
2. Backend common/ + production tooling
3. Frontend feature restructure
4. SSR/SEO conversion
5. Docker/CI/CD
6. Shared package cleanup
