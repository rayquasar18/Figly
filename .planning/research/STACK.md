# Stack Research — v2.0 Architecture & Production Hardening

**Researched:** 2026-03-20
**Confidence:** HIGH (versions verified via npm registry)

## Current → Target Versions

| Package | Current | Target | Breaking? |
|---------|---------|--------|-----------|
| Next.js | ^14.2.0 | 16.2.1 | YES — async request APIs, caching defaults |
| React | ^18.3.0 | 19.2.4 | YES — ref as prop, forwardRef removed |
| React DOM | ^18.3.0 | 19.2.4 | YES |
| @nestjs/core | ^10.4.0 | 11.1.17 | YES — deprecation removals |
| @nestjs/common | ^10.4.0 | 11.1.17 | YES |
| ESLint | none | 10.1.0 | N/A — new |
| Prettier | none | 3.8.1 | N/A — new |
| Husky | none | 9.1.7 | N/A — new |

## New Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| nestjs-pino | 4.6.1 | Structured logging |
| nestjs-zod | 5.1.1 | Unified Zod validation |
| @nestjs/swagger | 11.2.6 | OpenAPI docs |
| @nestjs/terminus | 11.1.1 | Health checks |
| lint-staged | 16.4.0 | Pre-commit filtering |

## Key Breaking Changes

### Next.js 14 → 16
- `cookies()`, `headers()`, `params`, `searchParams` now **async**
- `fetch`, GET Route Handlers, client nav **no longer cached by default**
- Turbopack Dev stable
- `next.config.ts` TypeScript support
- ESLint 9 flat config support
- React 19 required for App Router
- Codemod: `npx @next/codemod@canary upgrade latest`

### React 18 → 19
- `ref` is regular prop — no more `forwardRef`
- `<Context>` renders as provider directly
- `use()` hook for context/promises
- `@types/react` removed — types built-in
- TanStack Query v5, Zustand v5, RHF, shadcn/ui all compatible

### NestJS 10 → 11
- Node.js 18+ required (already met)
- Express 5 support
- Various deprecation removals
