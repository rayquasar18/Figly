---
phase: 2
slug: profiles-social-graph
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-14
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29 + ts-jest |
| **Config file** | `backend/jest.config.ts` |
| **Quick run command** | `cd backend && npx jest --testPathPattern="profiles\|social" --no-coverage -x` |
| **Full suite command** | `cd backend && npx jest --no-coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd backend && npx jest --testPathPattern="profiles|social" --no-coverage -x`
- **After every plan wave:** Run `cd backend && npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | PROF-01 | unit | `cd backend && npx jest src/profiles/__tests__/profiles.service.spec.ts -x` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | PROF-02 | unit | `cd backend && npx jest src/profiles/__tests__/profiles.service.spec.ts -x` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | PROF-03 | unit | `cd backend && npx jest src/profiles/__tests__/profiles.service.spec.ts -x` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | SOCL-01 | unit | `cd backend && npx jest src/social/__tests__/social.service.spec.ts -x` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | SOCL-02 | unit | `cd backend && npx jest src/social/__tests__/social.service.spec.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/src/profiles/__tests__/profiles.service.spec.ts` — stubs for PROF-01, PROF-02, PROF-03
- [ ] `backend/src/social/__tests__/social.service.spec.ts` — stubs for SOCL-01, SOCL-02
- [ ] No new framework install needed — Jest already configured

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Avatar upload renders correctly | PROF-01 | Visual rendering | Upload avatar, verify 3 thumbnail sizes display correctly |
| Profile page layout matches Instagram-style | PROF-03 | Visual design | Visit profile, verify avatar left/stats right/3-col grid |
| Follow button visual state toggle | SOCL-01 | UI interaction | Click follow, verify filled→outlined transition |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
