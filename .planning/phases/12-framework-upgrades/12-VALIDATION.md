---
phase: 12
slug: framework-upgrades
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.7.0 (backend) / Next.js build (frontend) |
| **Config file** | `backend/jest.config.ts` |
| **Quick run command** | `cd backend && pnpm run build && pnpm test -- --bail` |
| **Full suite command** | `cd backend && pnpm test && cd ../frontend && pnpm build` |
| **Estimated runtime** | ~60 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd backend && pnpm run build && pnpm test -- --bail`
- **After every plan wave:** Run `cd backend && pnpm test && cd ../frontend && pnpm build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 1 | FRMW-03 | build+unit | `cd backend && pnpm run build && pnpm test -- --bail` | ✅ | ⬜ pending |
| 12-01-02 | 01 | 1 | FRMW-03 | build | `cd backend && pnpm run build` | ✅ | ⬜ pending |
| 12-02-01 | 02 | 2 | FRMW-01 | build | `cd frontend && pnpm build` | ✅ | ⬜ pending |
| 12-03-01 | 03 | 2 | FRMW-02 | build | `cd frontend && pnpm build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

- Backend has 19 existing spec files covering all modules
- Frontend build verification is sufficient for React 19 / Next.js 16 migration (type errors surface at compile time)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| All existing features work after upgrades | FRMW-01, FRMW-02, FRMW-03 | E2E user flows require browser | Start app, test auth/posts/feed/collections/reels manually |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
