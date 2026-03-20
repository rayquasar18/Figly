---
phase: 6
slug: notifications
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29 + ts-jest |
| **Config file** | `backend/jest.config.ts` |
| **Quick run command** | `cd backend && npx jest --testPathPattern="notifications\|push" --no-coverage -x` |
| **Full suite command** | `cd backend && npx jest --no-coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd backend && npx jest --testPathPattern="notifications|push" --no-coverage -x`
- **After every plan wave:** Run `cd backend && npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | NOTF-01 | unit | `cd backend && npx jest src/notifications/__tests__/notifications.service.spec.ts -x` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | NOTF-01 | unit | `cd backend && npx jest src/notifications/__tests__/notifications.processor.spec.ts -x` | ❌ W0 | ⬜ pending |
| 06-01-03 | 01 | 1 | NOTF-02 | unit | `cd backend && npx jest src/notifications/__tests__/notifications.service.spec.ts -x` | ❌ W0 | ⬜ pending |
| 06-01-04 | 01 | 1 | NOTF-03 | unit | `cd backend && npx jest src/notifications/__tests__/push.service.spec.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/src/notifications/__tests__/notifications.service.spec.ts` — stubs for NOTF-01, NOTF-02 (notification creation, grouping, listing, mark-as-read)
- [ ] `backend/src/notifications/__tests__/notifications.processor.spec.ts` — stubs for NOTF-01 (BullMQ notification processing)
- [ ] `backend/src/notifications/__tests__/push.service.spec.ts` — stubs for NOTF-03 (push subscription, sending, cleanup)

*Existing test infrastructure (Jest + ts-jest) covers framework setup.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| SSE stream delivers real-time notifications | NOTF-01 | Requires active SSE connection in browser | Open app in 2 tabs, like a post from tab 2, verify notification appears in tab 1 |
| Push notification appears when tab is closed | NOTF-03 | Requires browser push API + service worker | Close app tab, trigger a like from another session, verify system push notification appears |
| Service worker click navigates to content | NOTF-03 | Requires browser interaction | Click a push notification, verify app opens to correct post/profile |
| Notification bell badge updates in real-time | NOTF-02 | Visual UI verification | Like a post, verify bell icon badge count increments without page refresh |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
