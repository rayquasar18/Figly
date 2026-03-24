---
phase: 13
slug: backend-hardening
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.7.0 + ts-jest 29.2.0 |
| **Config file** | `backend/jest.config.ts` |
| **Quick run command** | `cd backend && npx jest --testPathPattern={pattern} --no-coverage` |
| **Full suite command** | `cd backend && npx jest --no-coverage` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd backend && npx jest --no-coverage`
- **After every plan wave:** Run `cd backend && npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | BACK-01 | unit | `cd backend && npx jest --testPathPattern=env.schema --no-coverage` | ❌ W0 | ⬜ pending |
| 13-01-02 | 01 | 1 | BACK-02 | unit | `cd backend && npx jest --testPathPattern=all-exceptions --no-coverage` | ❌ W0 | ⬜ pending |
| 13-02-01 | 02 | 1 | BACK-03 | smoke | Manual: start server, verify JSON log output | N/A | ⬜ pending |
| 13-02-02 | 02 | 1 | BACK-04 | integration | `cd backend && npx jest --testPathPattern=health --no-coverage` | ❌ W0 | ⬜ pending |
| 13-03-01 | 03 | 2 | BACK-05 | smoke | Manual: start server, curl /api/docs | N/A | ⬜ pending |
| 13-03-02 | 03 | 2 | BACK-06 | unit | `cd backend && npx jest --testPathPattern=auth --no-coverage` | ✅ (update) | ⬜ pending |
| 13-03-03 | 03 | 2 | BACK-07 | unit | `cd backend && npx jest --testPathPattern=serializ --no-coverage` | ❌ W0 | ⬜ pending |
| 13-04-01 | 04 | 2 | BACK-08 | unit | `cd backend && npx jest --testPathPattern=throttle --no-coverage` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/src/config/__tests__/env.schema.spec.ts` — stubs for BACK-01
- [ ] `backend/src/common/filters/__tests__/all-exceptions.filter.spec.ts` — stubs for BACK-02
- [ ] `backend/src/health/__tests__/health.controller.spec.ts` — stubs for BACK-04
- [ ] `backend/src/common/interceptors/__tests__/serialization.spec.ts` — stubs for BACK-07
- [ ] `backend/src/throttle/__tests__/throttle.spec.ts` — stubs for BACK-08

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Log output is structured JSON with request context | BACK-03 | Runtime logging behavior requires running server | 1. Start server, 2. Make HTTP request, 3. Verify stdout is JSON with `req` field |
| Swagger UI accessible at /api/docs | BACK-05 | Requires running server and browser verification | 1. Start server, 2. Navigate to /api/docs, 3. Verify all endpoints listed |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
