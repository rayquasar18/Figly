---
phase: 9
slug: stories
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (backend) / vitest (frontend) |
| **Config file** | `backend/jest.config.ts` / `frontend/vitest.config.ts` |
| **Quick run command** | `cd backend && npx jest --testPathPattern=story --no-coverage` |
| **Full suite command** | `cd backend && npx jest --no-coverage && cd ../frontend && npx vitest run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd backend && npx jest --testPathPattern=story --no-coverage`
- **After every plan wave:** Run `cd backend && npx jest --no-coverage && cd ../frontend && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | CONT-08 | unit | `npx jest --testPathPattern=story.service` | ❌ W0 | ⬜ pending |
| 09-01-02 | 01 | 1 | CONT-08 | unit | `npx jest --testPathPattern=story.controller` | ❌ W0 | ⬜ pending |
| 09-01-03 | 01 | 1 | CONT-08 | integration | `npx jest --testPathPattern=story.e2e` | ❌ W0 | ⬜ pending |
| 09-02-01 | 02 | 1 | CONT-09 | unit | `npx vitest run --reporter=verbose src/components/stories` | ❌ W0 | ⬜ pending |
| 09-02-02 | 02 | 1 | CONT-09 | integration | `npx vitest run --reporter=verbose src/pages/feed` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/src/story/test/story.service.spec.ts` — stubs for CONT-08 (story CRUD, expiration)
- [ ] `backend/src/story/test/story.controller.spec.ts` — stubs for CONT-08 (API endpoints)
- [ ] `frontend/src/components/stories/__tests__/` — stubs for CONT-09 (story bar, viewer)
- [ ] `ffmpeg` binary availability check in test environment

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Story ring gradient animation | CONT-09 | Visual CSS animation | Inspect story bar; unviewed stories show gradient ring, viewed show grey |
| Full-screen story viewer tap navigation | CONT-09 | Touch/click interaction | Tap right side to advance, left to go back, tap progress bar segment to jump |
| 24-hour auto-expiration visual removal | CONT-08 | Time-dependent with UI | Create story, wait for cleanup job (or manually expire), confirm removal from bar |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
