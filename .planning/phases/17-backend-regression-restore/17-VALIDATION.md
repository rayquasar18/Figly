---
phase: 17
slug: backend-regression-restore
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                    |
| ---------------------- | -------------------------------------------------------- |
| **Framework**          | jest 29.x                                                |
| **Config file**        | `apps/backend/jest.config.ts`                            |
| **Quick run command**  | `pnpm --filter @figly/backend test -- --passWithNoTests` |
| **Full suite command** | `pnpm --filter @figly/backend test -- --passWithNoTests` |
| **Estimated runtime**  | ~15 seconds                                              |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @figly/backend test -- --passWithNoTests`
- **After every plan wave:** Run `pnpm --filter @figly/backend test -- --passWithNoTests`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement                        | Test Type        | Automated Command                   | File Exists | Status     |
| -------- | ---- | ---- | ---------------------------------- | ---------------- | ----------------------------------- | ----------- | ---------- |
| 17-01-01 | 01   | 1    | BACK-01, BACK-02, BACK-03, BACK-04 | unit+integration | `pnpm --filter @figly/backend test` | ✅          | ⬜ pending |
| 17-02-01 | 02   | 1    | BACK-06, BACK-07                   | unit             | `pnpm --filter @figly/backend test` | ✅          | ⬜ pending |
| 17-03-01 | 03   | 2    | BACK-08                            | unit+e2e         | `pnpm --filter @figly/backend test` | ✅          | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. Jest is already installed and configured.

---

## Manual-Only Verifications

| Behavior                      | Requirement | Why Manual                  | Test Instructions                                                        |
| ----------------------------- | ----------- | --------------------------- | ------------------------------------------------------------------------ |
| Backend starts without errors | BACK-04     | Requires running dev server | Run `pnpm --filter @figly/backend start:dev`, verify no crash within 10s |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
