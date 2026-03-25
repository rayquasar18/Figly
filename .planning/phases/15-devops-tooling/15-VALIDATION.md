---
phase: 15
slug: devops-tooling
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-25
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (backend), vitest (frontend if configured), shell assertions for Docker/CI |
| **Config file** | `backend/jest.config.ts`, `turbo.json` (test task), `.github/workflows/*.yml` |
| **Quick run command** | `pnpm turbo run lint --filter=./backend --filter=./frontend --filter=./packages/shared` |
| **Full suite command** | `pnpm turbo run lint typecheck build test` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm turbo run lint`
- **After every plan wave:** Run `pnpm turbo run lint typecheck build test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 15-01-01 | 01 | 1 | DEVP-01 | lint | `pnpm turbo run lint` | N/A (infra) | ⬜ pending |
| 15-01-02 | 01 | 1 | DEVP-02 | integration | `test -f .husky/pre-commit && grep -q lint-staged .husky/pre-commit` | N/A (infra) | ⬜ pending |
| 15-02-01 | 02 | 2 | DEVP-03 | ci-simulation | `pnpm lint && pnpm build && pnpm test` | N/A (infra) | ⬜ pending |
| 15-03-01 | 03 | 1 | DEVP-04 | structural | `test -f frontend/Dockerfile && test -f backend/Dockerfile && grep -q figly-frontend docker-compose.yml` | N/A (infra) | ⬜ pending |
| 15-03-02 | 03 | 1 | DEVP-04 | docker | `test ! -f Dockerfile && test ! -f docker-entrypoint.sh` | N/A (infra) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

None -- this phase is infrastructure/configuration, not application code. Existing backend tests (`pnpm test`) validate that linting config doesn't break test execution. Docker verification uses structural checks and build-time validation. The tools being created (ESLint, Prettier, CI workflow, Dockerfiles) ARE the test infrastructure for this phase.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Pre-commit hook blocks bad commits | DEVP-02 | Requires interactive git commit with lint errors | 1. Introduce lint error 2. `git add . && git commit -m "test"` 3. Verify commit is rejected |
| GitHub Actions blocks bad PRs | DEVP-03 | Requires actual GitHub PR creation | 1. Push branch with lint error 2. Create PR 3. Verify checks fail and merge blocked |
| Docker containers communicate | DEVP-04 | Requires running Docker environment | 1. `docker compose up -d` 2. `curl http://localhost:3000` 3. Verify frontend can reach backend API |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (N/A -- no MISSING references, infra phase)
- [x] No watch-mode flags
- [x] Feedback latency < 45s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved
