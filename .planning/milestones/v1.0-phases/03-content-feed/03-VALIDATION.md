---
phase: 3
slug: content-feed
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-14
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29 + ts-jest |
| **Config file** | `backend/jest.config.ts` |
| **Quick run command** | `cd backend && pnpm test -- --testPathPattern=posts\|comments\|feed` |
| **Full suite command** | `cd backend && pnpm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd backend && pnpm test -- --testPathPattern=<relevant_module>`
- **After every plan wave:** Run `cd backend && pnpm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | CONT-01 | unit | `cd backend && pnpm test -- --testPathPattern=posts.service.spec` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | CONT-02 | unit | `cd backend && pnpm test -- --testPathPattern=posts.service.spec` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | CONT-04 | unit | `cd backend && pnpm test -- --testPathPattern=posts.service.spec` | ❌ W0 | ⬜ pending |
| 03-01-04 | 01 | 1 | CONT-05 | unit | `cd backend && pnpm test -- --testPathPattern=posts.service.spec` | ❌ W0 | ⬜ pending |
| 03-01-05 | 01 | 1 | CONT-06 | unit | `cd backend && pnpm test -- --testPathPattern=posts.service.spec` | ❌ W0 | ⬜ pending |
| 03-01-06 | 01 | 1 | INTR-01 | unit | `cd backend && pnpm test -- --testPathPattern=posts.service.spec` | ❌ W0 | ⬜ pending |
| 03-01-07 | 01 | 1 | INTR-04 | unit | `cd backend && pnpm test -- --testPathPattern=posts.service.spec` | ❌ W0 | ⬜ pending |
| 03-01-08 | 01 | 1 | INTR-05 | unit | `cd backend && pnpm test -- --testPathPattern=posts.service.spec` | ❌ W0 | ⬜ pending |
| 03-01-09 | 01 | 1 | INTR-02 | unit | `cd backend && pnpm test -- --testPathPattern=comments.service.spec` | ❌ W0 | ⬜ pending |
| 03-01-10 | 01 | 1 | INTR-03 | unit | `cd backend && pnpm test -- --testPathPattern=comments.service.spec` | ❌ W0 | ⬜ pending |
| 03-01-11 | 01 | 1 | SOCL-03 | unit | `cd backend && pnpm test -- --testPathPattern=feed.service.spec` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | CONT-03 | manual | Manual browser test (Canvas API / react-easy-crop) | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/src/posts/__tests__/posts.service.spec.ts` — stubs for CONT-01, CONT-02, CONT-04, CONT-05, CONT-06, INTR-01, INTR-04, INTR-05
- [ ] `backend/src/comments/__tests__/comments.service.spec.ts` — stubs for INTR-02, INTR-03
- [ ] `backend/src/feed/__tests__/feed.service.spec.ts` — stubs for SOCL-03

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Client-side crop/rotate | CONT-03 | Canvas API + react-easy-crop is browser-only, cannot test in Jest | 1. Open create post flow 2. Select image 3. Drag to crop 4. Rotate 5. Confirm cropped output matches expected area |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
