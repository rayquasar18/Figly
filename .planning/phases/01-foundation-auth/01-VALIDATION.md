---
phase: 1
slug: foundation-auth
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x + @nestjs/testing |
| **Config file** | `backend/jest.config.ts` (Wave 0 installs) |
| **Quick run command** | `cd backend && pnpm test -- --testPathPattern=<pattern> --bail` |
| **Full suite command** | `pnpm turbo test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd backend && pnpm test -- --bail --testPathPattern=<relevant-module>`
- **After every plan wave:** Run `pnpm turbo test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | INFRA | integration | `pnpm turbo build` | Wave 0 | pending |
| 01-02-01 | 02 | 1 | AUTH-01 | integration | `cd backend && pnpm test -- --testPathPattern=auth.service.spec --bail` | Wave 0 | pending |
| 01-02-02 | 02 | 1 | AUTH-04 | integration | `cd backend && pnpm test -- --testPathPattern=jwt-refresh.spec --bail` | Wave 0 | pending |
| 01-02-03 | 02 | 2 | AUTH-02 | integration | `cd backend && pnpm test -- --testPathPattern=email-verification.spec --bail` | Wave 0 | pending |
| 01-02-04 | 02 | 2 | AUTH-03 | integration | `cd backend && pnpm test -- --testPathPattern=password-reset.spec --bail` | Wave 0 | pending |
| 01-02-05 | 02 | 2 | AUTH-05 | integration | `cd backend && pnpm test -- --testPathPattern=google-auth.spec --bail` | Wave 0 | pending |
| 01-02-06 | 02 | 2 | AUTH-06 | integration | `cd backend && pnpm test -- --testPathPattern=apple-auth.spec --bail` | Wave 0 | pending |
| 01-03-01 | 03 | 2 | INFRA | integration | `cd backend && pnpm test -- --testPathPattern=media.spec --bail` | Wave 0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `backend/jest.config.ts` — Jest configuration for NestJS
- [ ] `backend/test/jest-e2e.json` — E2E test configuration
- [ ] `backend/test/setup.ts` — Test setup (Prisma test utils, mock factories)
- [ ] `backend/src/auth/__tests__/auth.service.spec.ts` — Auth service unit tests
- [ ] `backend/src/auth/__tests__/email-verification.spec.ts` — Email verification flow
- [ ] `backend/src/auth/__tests__/password-reset.spec.ts` — Password reset flow
- [ ] `backend/src/auth/__tests__/jwt-refresh.spec.ts` — Token refresh flow
- [ ] `backend/src/auth/__tests__/google-auth.spec.ts` — Google OAuth flow
- [ ] `backend/src/auth/__tests__/apple-auth.spec.ts` — Apple Sign-In flow
- [ ] `backend/src/media/__tests__/media.spec.ts` — Media upload and processing
- [ ] Framework install: `pnpm add -D jest @nestjs/testing @types/jest ts-jest` (backend)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Email actually received in inbox | AUTH-02 | External service (Resend) | Send verification email via signup, check inbox |
| Google OAuth redirect flow | AUTH-05 | Requires browser interaction + Google credentials | Click Google login, complete OAuth flow, verify redirect |
| Apple Sign-In redirect flow | AUTH-06 | Requires browser interaction + Apple credentials | Click Apple login, complete OAuth flow, verify redirect |
| CDN URL accessible in browser | INFRA | External network access | Upload image, copy CDN URL, open in browser |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
