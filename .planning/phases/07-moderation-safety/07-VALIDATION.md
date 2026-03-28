---
phase: 7
slug: moderation-safety
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest + ts-jest (existing) |
| **Config file** | `backend/jest.config.ts` |
| **Quick run command** | `cd backend && npx jest --testPathPattern="moderation\|admin\|ban" --no-coverage -x` |
| **Full suite command** | `cd backend && npx jest --no-coverage` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd backend && npx jest --testPathPattern="moderation\|admin\|ban" --no-coverage -x`
- **After every plan wave:** Run `cd backend && npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | MODR-01 | unit | `cd backend && npx jest src/moderation/__tests__/moderation.service.spec.ts -x` | ❌ W0 | ⬜ pending |
| 07-01-02 | 01 | 1 | MODR-02 | unit | `cd backend && npx jest src/moderation/__tests__/block.spec.ts -x` | ❌ W0 | ⬜ pending |
| 07-01-03 | 01 | 1 | MODR-03 | unit | `cd backend && npx jest src/moderation/__tests__/mute.spec.ts -x` | ❌ W0 | ⬜ pending |
| 07-01-04 | 01 | 1 | MODR-04 | unit | `cd backend && npx jest src/admin/__tests__/admin.service.spec.ts -x` | ❌ W0 | ⬜ pending |
| 07-01-05 | 01 | 1 | MODR-02+ | unit | `cd backend && npx jest src/feed/__tests__/feed-block-filter.spec.ts -x` | ❌ W0 | ⬜ pending |
| 07-01-06 | 01 | 1 | MODR-02+ | unit | `cd backend && npx jest src/auth/__tests__/ban-check.spec.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/src/moderation/__tests__/moderation.service.spec.ts` — stubs for MODR-01 (report CRUD)
- [ ] `backend/src/moderation/__tests__/block.spec.ts` — stubs for MODR-02 (block/unblock + auto-unfollow)
- [ ] `backend/src/moderation/__tests__/mute.spec.ts` — stubs for MODR-03 (mute/unmute toggle)
- [ ] `backend/src/admin/__tests__/admin.service.spec.ts` — stubs for MODR-04 (queue listing + actions)
- [ ] `backend/src/feed/__tests__/feed-block-filter.spec.ts` — covers block/mute feed filtering
- [ ] `backend/src/auth/__tests__/ban-check.spec.ts` — covers ban check in login paths

*Existing infrastructure covers framework setup. Only test files needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Block confirmation dialog appears | MODR-02 | UI interaction flow | Visit user profile > three-dot menu > Block > verify dialog appears with warning text |
| Muted user content hidden from feed | MODR-03 | End-to-end visual check | Mute a user > reload feed > verify their posts are not visible |
| Admin queue page renders reports | MODR-04 | Full page render check | Login as admin > navigate to /admin > verify reports listed with actions |
| Blocked user sees "Nguoi dung khong ton tai" | MODR-02 | Cross-session UX | Login as blocked user > visit blocker's profile > verify 404-like message |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
