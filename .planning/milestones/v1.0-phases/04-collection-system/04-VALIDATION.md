---
phase: 4
slug: collection-system
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x + ts-jest |
| **Config file** | `backend/jest.config.ts` |
| **Quick run command** | `cd backend && npx jest --testPathPattern="(collection|checklist)" --no-coverage -x` |
| **Full suite command** | `cd backend && npx jest --no-coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd backend && npx jest --testPathPattern="(collection|checklist)" --no-coverage -x`
- **After every plan wave:** Run `cd backend && npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | COLL-01 | unit | `cd backend && npx jest collection.service.spec.ts -x` | No -- Wave 0 | ⬜ pending |
| 04-01-02 | 01 | 1 | COLL-02 | unit | `cd backend && npx jest collection.service.spec.ts -x` | No -- Wave 0 | ⬜ pending |
| 04-01-03 | 01 | 1 | COLL-03 | unit | `cd backend && npx jest collection.service.spec.ts -x` | No -- Wave 0 | ⬜ pending |
| 04-01-04 | 01 | 1 | COLL-04 | unit | `cd backend && npx jest collection.service.spec.ts -x` | No -- Wave 0 | ⬜ pending |
| 04-02-01 | 02 | 1 | COLL-05 | unit | `cd backend && npx jest checklist.service.spec.ts -x` | No -- Wave 0 | ⬜ pending |
| 04-02-02 | 02 | 1 | COLL-06 | unit | `cd backend && npx jest checklist.service.spec.ts -x` | No -- Wave 0 | ⬜ pending |
| 04-02-03 | 02 | 1 | COLL-07 | unit | `cd backend && npx jest checklist.service.spec.ts -x` | No -- Wave 0 | ⬜ pending |
| 04-03-01 | 03 | 2 | CONT-07 | unit | `cd backend && npx jest posts.service.spec.ts -x` | Exists (extend) | ⬜ pending |
| 04-03-02 | 03 | 2 | PROF-04 | manual | Visual verification of tab + grid | N/A | ⬜ pending |
| 04-03-03 | 03 | 2 | SOCL-04 | unit | `cd backend && npx jest collection.service.spec.ts -x` | No -- Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/src/collection/__tests__/collection.service.spec.ts` — stubs for COLL-01, COLL-02, COLL-03, COLL-04, SOCL-04
- [ ] `backend/src/checklist/__tests__/checklist.service.spec.ts` — stubs for COLL-05, COLL-06, COLL-07
- [ ] Extend `backend/src/posts/__tests__/posts.service.spec.ts` — stubs for CONT-07

*Framework already installed — no additional setup needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Profile collection showcase tab with owned items grid | PROF-04 | Visual layout, tab integration, category grouping | 1. Navigate to user profile 2. Click "Collection" tab 3. Verify owned items display by category 4. Verify empty state |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
