---
phase: 11
slug: bugfixes-ux-flow
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (backend), vitest (frontend if configured) |
| **Config file** | `backend/jest.config.ts`, `backend/tsconfig.json` |
| **Quick run command** | `cd backend && npx jest --passWithNoTests --testPathPattern="auth"` |
| **Full suite command** | `cd backend && npx jest --passWithNoTests` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd backend && npx jest --passWithNoTests --testPathPattern="auth"`
- **After every plan wave:** Run `cd backend && npx jest --passWithNoTests`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | BUGF-01 | unit | `cd backend && npx jest --testPathPattern="auth.service"` | ✅ | ⬜ pending |
| 11-01-02 | 01 | 1 | BUGF-02 | unit | `cd backend && npx jest --testPathPattern="auth.service"` | ✅ | ⬜ pending |
| 11-02-01 | 02 | 1 | BUGF-03 | manual | Browser test: complete-profile → homepage | ❌ | ⬜ pending |
| 11-03-01 | 03 | 2 | BUGF-04 | manual | Browser test: explore page loads | ❌ | ⬜ pending |
| 11-04-01 | 04 | 2 | BUGF-05 | manual | Browser test: sidebar visible on desktop | ❌ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. Backend jest setup is in place with auth test files.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Complete-profile redirect flow | BUGF-03 | End-to-end browser redirect chain | 1. Sign up new user 2. Verify email 3. Complete profile 4. Verify lands on homepage |
| Explore page loads content | BUGF-04 | Runtime rendering + API integration | 1. Navigate to /explore 2. Verify posts/reels render without errors |
| Desktop sidebar visible | BUGF-05 | Visual layout verification | 1. Open app at ≥768px width 2. Verify sidebar with 6 nav items |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
