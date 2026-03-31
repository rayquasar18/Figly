---
phase: 5
slug: search-discovery
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest with ts-jest |
| **Config file** | `backend/jest.config.ts` |
| **Quick run command** | `cd backend && npx jest --testPathPattern="search\|hashtag\|explore" --no-coverage -x` |
| **Full suite command** | `cd backend && npx jest --no-coverage` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd backend && npx jest --testPathPattern="search|hashtag|explore" --no-coverage -x`
- **After every plan wave:** Run `cd backend && npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | DISC-01 | unit | `cd backend && npx jest src/search/__tests__/search.service.spec.ts -x` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | DISC-02 | unit | `cd backend && npx jest src/posts/__tests__/hashtag-posts.spec.ts -x` | ❌ W0 | ⬜ pending |
| 05-01-03 | 01 | 1 | DISC-03 | unit | `cd backend && npx jest src/feed/__tests__/explore-feed.spec.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/src/search/__tests__/search.service.spec.ts` — stubs for DISC-01 unified search delegation
- [ ] `backend/src/posts/__tests__/hashtag-posts.spec.ts` — stubs for DISC-02 getPostsByHashtag
- [ ] `backend/src/feed/__tests__/explore-feed.spec.ts` — stubs for DISC-03 getExploreFeed

*Existing infrastructure covers framework setup. Only test stubs needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Search route doesn't conflict with [username] | DISC-01 | Next.js routing priority | Navigate to /search, verify search page renders (not a profile) |
| Hashtag links in captions navigate to hashtag page | DISC-02 | Navigation integration | Tap a #hashtag in a post caption, verify hashtag page loads |
| Explore page shows category sections with posts | DISC-03 | Visual layout verification | Open /explore, verify category headers with post thumbnails |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
