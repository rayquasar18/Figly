---
phase: 14
slug: frontend-restructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (via Next.js) |
| **Config file** | `frontend/vitest.config.ts` or "none — Wave 0 installs" |
| **Quick run command** | `cd frontend && npx next build` |
| **Full suite command** | `cd frontend && npx next build && npx vitest run` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd frontend && npx next build`
- **After every plan wave:** Run `cd frontend && npx next build && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 14-01-01 | 01 | 1 | FRNT-01 | build | `cd frontend && npx next build` | ✅ | ⬜ pending |
| 14-02-01 | 02 | 1 | FRNT-02 | build+manual | `cd frontend && npx next build` | ✅ | ⬜ pending |
| 14-03-01 | 03 | 2 | FRNT-03 | build+curl | `cd frontend && npx next build` | ✅ | ⬜ pending |
| 14-04-01 | 04 | 2 | FRNT-04 | build | `cd frontend && npx next build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Verify `frontend/vitest.config.ts` exists or create stub
- [ ] Verify `next build` succeeds before restructuring

*Existing infrastructure covers most phase requirements — build validation is the primary gate.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Auth redirect (no flash) | FRNT-02 | Requires browser to verify no FOUC | Open protected route in incognito, verify redirect before content paint |
| Dark mode toggle persist | FRNT-04 | Requires browser localStorage + visual check | Toggle dark mode, refresh, verify persisted |
| OG meta tags in page source | FRNT-03 | Requires curl/view-source to verify SSR output | `curl -s localhost:3000/profile/username \| grep og:image` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
