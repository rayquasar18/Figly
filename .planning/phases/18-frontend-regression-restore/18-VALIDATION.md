---
phase: 18
slug: frontend-regression-restore
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 18 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                              |
| ---------------------- | -------------------------------------------------- |
| **Framework**          | TypeScript compiler (tsc --noEmit) + Next.js build |
| **Config file**        | `frontend/tsconfig.json`                           |
| **Quick run command**  | `pnpm --filter @figly/frontend exec tsc --noEmit`  |
| **Full suite command** | `pnpm --filter @figly/frontend build`              |
| **Estimated runtime**  | ~30 seconds                                        |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @figly/frontend exec tsc --noEmit`
- **After every plan wave:** Run `pnpm --filter @figly/frontend build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Test Type  | Automated Command                                                                         | File Exists | Status     |
| -------- | ---- | ---- | ----------- | ---------- | ----------------------------------------------------------------------------------------- | ----------- | ---------- |
| 18-01-01 | 01   | 1    | FRNT-03     | grep audit | `grep -rl "use client" frontend/src/app/**/page.tsx \| wc -l` (expect 0)                  | N/A         | ⬜ pending |
| 18-01-02 | 01   | 1    | FRMW-02     | grep audit | `grep -rL "metadata\|generateMetadata" frontend/src/app/**/page.tsx` (expect empty)       | N/A         | ⬜ pending |
| 18-02-01 | 02   | 1    | FRNT-01     | typecheck  | `pnpm --filter @figly/frontend exec tsc --noEmit 2>&1 \| grep TS2307 \| wc -l` (expect 0) | N/A         | ⬜ pending |
| 18-03-01 | 03   | 1    | FRMW-01     | grep audit | `grep -r "forwardRef" frontend/src/components/ui/ \| wc -l` (expect 0)                    | N/A         | ⬜ pending |
| 18-04-01 | 04   | 2    | FRMW-02     | build      | `pnpm --filter @figly/frontend build` (expect exit 0)                                     | N/A         | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. TypeScript compiler and Next.js build provide all needed validation.

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
