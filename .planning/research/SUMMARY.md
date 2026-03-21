# Research Summary — v2.0 Architecture & Production Hardening

**Project:** Figly
**Researched:** 2026-03-20

## Stack Upgrades
- Next.js 14→16.2.1, React 18→19.2.4, NestJS 10→11.1.17
- New: ESLint 10.1.0, Prettier 3.8.1, Husky 9.1.7, nestjs-pino 4.6.1, nestjs-zod 5.1.1, @nestjs/swagger 11.2.6, @nestjs/terminus 11.1.1
- All existing UI libs (shadcn, Radix, TQ5, Zustand5, RHF) compatible with React 19

## Key Findings
- **Biggest risk**: Directory restructure (~100+ files) and async API changes in Next.js 15+
- **Biggest win**: Env validation + exception filter (security fix, low effort)
- **Architecture**: Move to features/ pattern (frontend), add common/ (backend)
- **Shared package**: Rename dto→schemas, remove dist from git

## Recommended Phase Order
1. Framework upgrades (React 19, Next.js 16, NestJS 11)
2. Backend hardening (common/, env validation, exception filter, logging, health, swagger)
3. Frontend restructure (features/ pattern, cleanup)
4. SSR/SEO (public routes → server components, generateMetadata)
5. DevOps (ESLint, Prettier, Husky, CI/CD, Docker split)
6. Shared package & final cleanup

## Watch Out For
- Next.js async request APIs (cookies/headers/params must be awaited)
- forwardRef removal in React 19
- Import path breakage during directory restructure
- Hydration mismatches when converting to SSR
