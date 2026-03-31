# Phase 15: DevOps & Tooling - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Automated quality gates (ESLint/Prettier/Husky), CI/CD pipeline (GitHub Actions), and production-ready dual-container Docker setup for the Figly monorepo.

</domain>

<decisions>
## Implementation Decisions

### Docker Split (DEVP-04)
- **D-01:** 2 separate Dockerfiles — `frontend/Dockerfile` and `backend/Dockerfile`, each self-contained
- **D-02:** Update existing `docker-compose.yml` — replace single `app` service with `figly-frontend` + `figly-backend` services. Keep postgres/redis/minio as-is
- **D-03:** Next.js standalone output mode — minimal production image (~150MB), no full node_modules
- **D-04:** Runtime env + Docker internal network — `NEXT_PUBLIC_API_URL` set via Docker env, backend reachable at `http://figly-backend:4000/api` within Docker network
- **D-05:** Frontend exposes port 3000, backend exposes port 4000 (unchanged from current setup)
- **D-06:** Remove old root `Dockerfile` and `docker-entrypoint.sh` after new setup is verified

### ESLint & Prettier (DEVP-01)
### Claude's Discretion
- ESLint flat config (eslint.config.mjs) vs legacy .eslintrc — Claude decides based on current ecosystem best practice
- ESLint rule strictness level — enforce strict but auto-fixable rules to avoid blocking existing code
- Prettier config details (printWidth, trailingComma, etc.) — match existing conventions from CONVENTIONS.md: 2-space indent, single quotes, trailing commas
- How to handle existing violations — auto-fix what's possible, suppress remaining with inline comments or phased approach
- Whether to add `eslint-plugin-import` for import ordering enforcement

### Pre-commit Hooks (DEVP-02)
### Claude's Discretion
- Husky + lint-staged configuration details
- What runs on pre-commit: lint-staged with ESLint --fix + Prettier --write on staged files
- Whether to include type-check in pre-commit (slower) or only in CI

### CI/CD Pipeline (DEVP-03)
### Claude's Discretion
- GitHub Actions workflow structure (single workflow vs matrix)
- Pipeline steps: lint, type-check, build, test on push to develop + PRs
- Whether to add Docker build verification in CI
- Branch protection rules configuration
- Cache strategy for pnpm dependencies and Turbo cache

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — DEVP-01 through DEVP-04 define the scope

### Existing Docker Setup (to be replaced)
- `Dockerfile` — Current single-container Dockerfile (root level)
- `docker-entrypoint.sh` — Current entrypoint running both processes
- `docker-compose.yml` — Current compose with single `app` service

### Build Configuration
- `turbo.json` — Turborepo task config (lint, build, test, dev tasks defined)
- `package.json` — Root workspace scripts (dev, build, test, lint via turbo)
- `frontend/next.config.js` — Next.js config (needs `output: 'standalone'` for Docker)
- `backend/nest-cli.json` — NestJS CLI build config

### Codebase Maps
- `.planning/codebase/CONVENTIONS.md` — Existing code style: 2-space indent, single quotes, trailing commas, kebab-case files
- `.planning/codebase/STACK.md` — Full tech stack details, Node 20 Alpine, pnpm 9.15.9

### Prior Context
- `.planning/phases/14-frontend-restructure/14-CONTEXT.md` — features/ directory pattern, barrel exports, `@/features/*` imports

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `turbo.json` — Already has `lint`, `build`, `test` task definitions; needs workspace lint scripts to be created
- `docker-compose.yml` — Infrastructure services (postgres, redis, minio) well-configured with healthchecks; only `app` service needs replacement

### Established Patterns
- **Monorepo:** 3 workspaces — frontend, backend, packages/shared. All tooling must work across workspaces
- **Package manager:** pnpm 9.15.9, enforced via `packageManager` field
- **Build:** Turbo orchestrates cross-workspace builds with `^build` dependency chain
- **Code style (unconfigured but consistent):** 2-space indent, single quotes, trailing commas, kebab-case files

### Integration Points
- Each workspace needs its own ESLint config + lint script in package.json
- Root needs Prettier config + Husky setup
- `.github/workflows/` directory needs creation for CI/CD
- `frontend/next.config.js` needs `output: 'standalone'` added
- Root `Dockerfile` and `docker-entrypoint.sh` will be replaced by per-workspace Dockerfiles

</code_context>

<specifics>
## Specific Ideas

- Docker containers must be named `figly-frontend` and `figly-backend` per user preference (from memory)
- Always rebuild and test Docker after changes (user feedback)
- Best practice throughout — production-grade setup

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 15-devops-tooling*
*Context gathered: 2026-03-25*
