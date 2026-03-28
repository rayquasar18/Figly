---
phase: 10
slug: reels
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (backend), vitest (frontend — if configured) |
| **Config file** | `backend/jest.config.ts` |
| **Quick run command** | `cd backend && npx jest --testPathPattern="reels\|media" --no-coverage` |
| **Full suite command** | `cd backend && npx jest --no-coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd backend && npx jest --testPathPattern="reels\|media" --no-coverage`
- **After every plan wave:** Run `cd backend && npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | CONT-10 | unit | `npx jest --testPathPattern="reels.service"` | ❌ W0 | ⬜ pending |
| 10-01-02 | 01 | 1 | CONT-10 | unit | `npx jest --testPathPattern="reels.controller"` | ❌ W0 | ⬜ pending |
| 10-01-03 | 01 | 1 | CONT-10 | unit | `npx jest --testPathPattern="media.processor"` | ✅ | ⬜ pending |
| 10-02-01 | 02 | 2 | CONT-11 | manual | Browser scroll behavior | N/A | ⬜ pending |
| 10-02-02 | 02 | 2 | CONT-11 | manual | Browser video autoplay | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/src/reels/__tests__/reels.service.spec.ts` — stubs for CONT-10
- [ ] `backend/src/reels/__tests__/reels.controller.spec.ts` — stubs for CONT-10

*Existing media processor tests cover transcoding pipeline.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Vertical scroll snap | CONT-11 | CSS scroll-snap behavior requires browser | Open /reels, swipe up, verify snap to next reel |
| Video autoplay muted | CONT-11 | Browser autoplay policy | Open /reels, verify video plays muted |
| Video loop | CONT-11 | Playback behavior | Watch reel to end, verify it loops |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
