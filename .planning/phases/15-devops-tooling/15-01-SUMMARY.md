---
phase: 15-devops-tooling
plan: 01
subsystem: infra
tags: [eslint, prettier, husky, lint-staged, code-quality, pre-commit]

# Dependency graph
requires: []
provides:
  - "ESLint 9 flat config across all 3 workspaces (frontend, backend, shared)"
  - "Prettier formatting with Tailwind CSS class sorting"
  - "Husky pre-commit hook with lint-staged for automated quality gates"
  - "Zero lint errors on pnpm lint across entire monorepo"
affects: [15-devops-tooling, all-future-phases]

# Tech tracking
tech-stack:
  added: [eslint@9.39, prettier@3.8, typescript-eslint@8.57, eslint-config-next@15.5, eslint-config-prettier@10.1, eslint-plugin-prettier@5.5, prettier-plugin-tailwindcss@0.7, husky@9.1, lint-staged@16.4, globals@17.4, "@eslint/eslintrc@3.0", "@eslint/js@9.27"]
  patterns: [eslint-flat-config, workspace-lint-scripts, pre-commit-quality-gate, prettier-plugin-tailwindcss]

key-files:
  created:
    - ".prettierrc"
    - ".prettierignore"
    - "frontend/eslint.config.mjs"
    - "backend/eslint.config.mjs"
    - "packages/shared/eslint.config.mjs"
    - ".husky/pre-commit"
    - ".lintstagedrc.json"
  modified:
    - "package.json"
    - "frontend/package.json"
    - "backend/package.json"
    - "packages/shared/package.json"
    - "frontend/src/components/social/follower-list.tsx"
    - "frontend/src/hooks/queries/social-queries.ts"

key-decisions:
  - "ESLint 9 flat config (eslint.config.mjs) over legacy .eslintrc -- flat config is default since ESLint 9"
  - "eslint-config-next@15.5 instead of @14 -- v14 bundles react-hooks canary incompatible with ESLint 9"
  - "no-require-imports disabled for tailwind.config.ts -- require() needed for tailwindcss-animate plugin"
  - "Type-check excluded from pre-commit hook -- too slow (10-30s), deferred to CI only"
  - "@typescript-eslint/no-explicit-any set to warn (frontend/shared) and off (backend) -- avoid blocking existing patterns"

patterns-established:
  - "ESLint flat config: each workspace has its own eslint.config.mjs with tseslint.config() wrapper"
  - "Pre-commit hook: Husky runs lint-staged which auto-fixes ESLint + Prettier on staged files"
  - "Prettier formatting: singleQuote, trailingComma all, tabWidth 2, printWidth 100, tailwindcss plugin"
  - "Lint scripts: all workspaces use eslint . via turbo lint pipeline"

requirements-completed: [DEVP-01, DEVP-02]

# Metrics
duration: 6min
completed: 2026-03-25
---

# Phase 15 Plan 01: ESLint + Prettier + Husky Summary

**ESLint 9 flat config + Prettier across all 3 workspaces with zero errors, plus Husky pre-commit hook running lint-staged for automated quality gates**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-25T16:41:19Z
- **Completed:** 2026-03-25T16:48:00Z
- **Tasks:** 2
- **Files modified:** 155+

## Accomplishments
- Configured ESLint 9 flat config with TypeScript, Prettier integration across frontend, backend, and shared workspaces
- Formatted entire codebase with Prettier (single quotes, trailing commas, Tailwind CSS class sorting)
- Set up Husky pre-commit hook with lint-staged for automated code quality enforcement
- Fixed conditional hooks bug in follower-list.tsx (rules-of-hooks violation)
- All workspaces pass `pnpm lint` with zero errors (warnings only for non-critical patterns)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install ESLint + Prettier dependencies and create config files** - `f6352fb` (feat)
2. **Task 2: Set up Husky pre-commit hook with lint-staged** - `26f017f` (chore)

## Files Created/Modified
- `.prettierrc` - Shared Prettier config (singleQuote, trailingComma, tailwindcss plugin)
- `.prettierignore` - Prettier ignore patterns (node_modules, dist, .next, pnpm-lock)
- `frontend/eslint.config.mjs` - Frontend ESLint flat config with Next.js + TypeScript + Prettier
- `backend/eslint.config.mjs` - Backend ESLint flat config with TypeScript + Prettier + CommonJS support
- `packages/shared/eslint.config.mjs` - Shared package ESLint flat config
- `.husky/pre-commit` - Pre-commit hook running lint-staged
- `.lintstagedrc.json` - lint-staged config with workspace-aware patterns
- `package.json` - Added prepare script, dev dependencies (eslint, prettier, husky, lint-staged)
- `frontend/package.json` - Updated lint script to `eslint .`, added ESLint dev dependencies
- `backend/package.json` - Updated lint script to `eslint .`, added ESLint dev dependencies
- `packages/shared/package.json` - Updated lint script to `eslint .`, added ESLint dev dependencies
- `frontend/src/components/social/follower-list.tsx` - Fixed conditional hooks bug
- `frontend/src/hooks/queries/social-queries.ts` - Added enabled parameter to useFollowers/useFollowing

## Decisions Made
- Used ESLint 9 flat config (eslint.config.mjs) as it is the default since ESLint 9, legacy .eslintrc is deprecated
- Upgraded eslint-config-next from v14 to v15.5 because v14 bundles eslint-plugin-react-hooks canary that uses removed context.getScope API incompatible with ESLint 9
- Set @typescript-eslint/no-explicit-any to warn (frontend/shared) and off (backend) to avoid blocking established patterns
- Set @typescript-eslint/no-require-imports to off for backend (CommonJS modules) and tailwind.config.ts
- Excluded type-check from pre-commit hook (runs 10-30s on full monorepo); will run in CI instead (DEVP-03)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Upgraded eslint-config-next from v14 to v15.5**
- **Found during:** Task 1 (ESLint configuration)
- **Issue:** eslint-config-next@14.2.29 bundles eslint-plugin-react-hooks canary (5.0.0-canary) which uses context.getScope -- an API removed in ESLint 9, causing TypeError crash
- **Fix:** Installed eslint-config-next@15.5.14 which bundles a compatible react-hooks plugin
- **Files modified:** frontend/package.json, pnpm-lock.yaml
- **Verification:** `pnpm lint` passes with zero errors
- **Committed in:** f6352fb (Task 1 commit)

**2. [Rule 1 - Bug] Fixed conditional hooks in follower-list.tsx**
- **Found during:** Task 1 (ESLint linting pass)
- **Issue:** useFollowers and useFollowing called conditionally in a ternary -- violates React rules-of-hooks
- **Fix:** Call both hooks unconditionally with `enabled` parameter to control which one is active
- **Files modified:** frontend/src/components/social/follower-list.tsx, frontend/src/hooks/queries/social-queries.ts
- **Verification:** ESLint rules-of-hooks error resolved, both hooks receive `enabled` param
- **Committed in:** f6352fb (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both auto-fixes necessary for ESLint compatibility and React correctness. No scope creep.

## Issues Encountered
- eslint-config-next@14 peer dependency incompatibility with ESLint 9 -- resolved by upgrading to v15.5 which has proper ESLint 9 support via FlatCompat

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Lint pipeline fully operational: `pnpm lint` checks all workspaces via turbo
- Pre-commit hook blocks commits with violations
- Ready for Plan 15-02 (CI/CD pipeline) and Plan 15-03 (Docker split)

---
*Phase: 15-devops-tooling*
*Completed: 2026-03-25*

## Self-Check: PASSED

- All 7 created files verified present
- All 2 task commit hashes verified in git log
