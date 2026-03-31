# Pitfalls Research — v2.0 Migration Risks

**Researched:** 2026-03-20

## Critical Risks

### 1. React 19 (HIGH)
- forwardRef removed, ref as regular prop
- Context.Provider → Context directly
- @types/react removed (built-in)
- **All existing libs compatible** (shadcn, Radix, TQ5, Zustand5, RHF)

### 2. Next.js Async APIs (HIGH)
- cookies/headers/params/searchParams now async
- Use codemod for automated fixes
- Figly uses client-side auth, impact limited

### 3. Directory Restructure (HIGH)
- ~100+ files with cross-references
- Use git mv, IDE refactoring, one feature at a time
- Full type-check after each batch

### 4. SSR Conversion (MEDIUM)
- Client hooks cant be in Server Components
- Pattern: Server wrapper → Client children
- Need server-fetch.ts for server-side API calls

### 5. NestJS 11 (LOW)
- Mostly backward compatible
- Follow official migration guide

## Recommended Phase Order
1. Framework upgrades first (biggest risk)
2. Backend common/ + production tooling (low risk, high value)
3. Frontend feature restructure
4. SSR/SEO conversion
5. Docker/CI/CD
6. Shared package cleanup (last — touches both sides)
