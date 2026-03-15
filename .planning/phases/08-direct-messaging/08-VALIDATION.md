---
phase: 8
slug: direct-messaging
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.7.0 + ts-jest |
| **Config file** | backend/jest.config.ts |
| **Quick run command** | `cd backend && npx jest --testPathPattern=messaging --forceExit` |
| **Full suite command** | `cd backend && npx jest --forceExit` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd backend && npx jest --testPathPattern=messaging --forceExit`
- **After every plan wave:** Run `cd backend && npx jest --forceExit`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | MESG-01 | unit | `cd backend && npx jest src/messaging/__tests__/conversations.service.spec.ts -x` | ❌ W0 | ⬜ pending |
| 08-01-02 | 01 | 1 | MESG-01 | unit | `cd backend && npx jest src/messaging/__tests__/messages.service.spec.ts -x` | ❌ W0 | ⬜ pending |
| 08-01-03 | 01 | 1 | MESG-01 | integration | `cd backend && npx jest src/messaging/__tests__/messaging.gateway.spec.ts -x` | ❌ W0 | ⬜ pending |
| 08-02-01 | 02 | 1 | MESG-02 | unit | `cd backend && npx jest src/messaging/__tests__/messages.service.spec.ts -x` | ❌ W0 | ⬜ pending |
| 08-03-01 | 01 | 1 | MESG-03 | unit | `cd backend && npx jest src/messaging/__tests__/messages.service.spec.ts -x` | ❌ W0 | ⬜ pending |
| 08-04-01 | 02 | 1 | MESG-04 | unit | `cd backend && npx jest src/messaging/__tests__/conversations.service.spec.ts -x` | ❌ W0 | ⬜ pending |
| 08-05-01 | 01 | 1 | ALL | unit | `cd backend && npx jest src/messaging/__tests__/conversations.service.spec.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/src/messaging/__tests__/conversations.service.spec.ts` — stubs for MESG-01 (1-on-1 creation, duplicate prevention), MESG-04 (group CRUD, participant management), block enforcement
- [ ] `backend/src/messaging/__tests__/messages.service.spec.ts` — stubs for MESG-01 (send/receive), MESG-02 (media attachment), MESG-03 (read receipts, unread counts)
- [ ] `backend/src/messaging/__tests__/messaging.gateway.spec.ts` — stubs for WebSocket connection, auth, room management, message broadcast
- [ ] `@nestjs/websockets` and `@nestjs/platform-socket.io` packages installed

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real-time message delivery in browser | MESG-01 | Requires two browser sessions with WebSocket | 1. Open two browsers, 2. Log in as different users, 3. Send message in one, 4. Verify instant delivery in other |
| Read receipt visual indicator | MESG-03 | UI visual behavior | 1. Send message, 2. Open as recipient, 3. Verify read indicator appears for sender |
| Media preview in chat | MESG-02 | Visual rendering | 1. Upload image in DM, 2. Verify thumbnail renders, 3. Click to view full size |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
