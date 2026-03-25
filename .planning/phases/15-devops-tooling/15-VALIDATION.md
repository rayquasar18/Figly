---
phase: 15
slug: devops-tooling
status: draft
nyquist_compliant: false
wave_0_complete: false
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
| 15-01-01 | 01 | 1 | DEVP-01 | lint | `pnpm turbo run lint` | ❌ W0 | ⬜ pending |
| 15-01-02 | 01 | 1 | DEVP-01 | format | `pnpm prettier --check .` | ❌ W0 | ⬜ pending |
| 15-02-01 | 02 | 1 | DEVP-02 | integration | `git stash && echo "test" > test.txt && git add test.txt && git commit -m "test" 2>&1` | ❌ W0 | ⬜ pending |
| 15-03-01 | 03 | 2 | DEVP-03 | ci-validation | `act -j lint --dryrun` or manual GH Actions check | ❌ W0 | ⬜ pending |
| 15-04-01 | 04 | 2 | DEVP-04 | docker | `docker compose build && docker compose up -d && curl -f http://localhost:3000 && curl -f http://localhost:4000/api` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Root `eslint.config.mjs` — ESLint flat config base
- [ ] Root `.prettierrc` — Prettier configuration
- [ ] Workspace `lint` scripts in each `package.json` — required by turbo
- [ ] `pnpm turbo run lint` — must exit 0 after Wave 1

*Existing infrastructure covers test framework (jest in backend). Linting/formatting tools are Wave 1 deliverables that become the test infra.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Pre-commit hook blocks bad commits | DEVP-02 | Requires interactive git commit with lint errors | 1. Introduce lint error 2. `git add . && git commit -m "test"` 3. Verify commit is rejected |
| GitHub Actions blocks bad PRs | DEVP-03 | Requires actual GitHub PR creation | 1. Push branch with lint error 2. Create PR 3. Verify checks fail and merge blocked |
| Docker containers communicate | DEVP-04 | Requires running Docker environment | 1. `docker compose up -d` 2. `curl http://localhost:3000` 3. Verify frontend can reach backend API |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
