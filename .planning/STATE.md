---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Completed 02-01 Schema & Shared Types
last_updated: "2026-03-13T20:55:51Z"
last_activity: 2026-03-14 -- Completed 02-01 Schema extension, shared types/validators, signup username
progress:
  total_phases: 10
  completed_phases: 1
  total_plans: 7
  completed_plans: 4
  percent: 25
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-13)

**Core value:** Collectors can share, showcase, and manage their collections in a community of shared passion -- combining social media with collection tracking.
**Current focus:** Phase 2: Profiles & Social Graph

## Current Position

Phase: 2 of 10 (Profiles & Social Graph)
Plan: 1 of 4 in current phase (complete)
Status: Executing
Last activity: 2026-03-14 -- Completed 02-01 Schema extension, shared types/validators, signup username

Progress: [███░░░░░░░] 25% (Phase 2: 1/4 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 4
- Average duration: 11 min
- Total execution time: 0.73 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-auth | 3 | 37 min | 12 min |
| 02-profiles-social-graph | 1 | 7 min | 7 min |

**Recent Trend:**
- Last 5 plans: 11, 15, 11, 7 min
- Trend: improving

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: Collection system (Phase 4) placed early, before search/notifications/messaging, to validate the core differentiator
- [Roadmap]: Stories and Reels deferred to Phases 9-10 as engagement multipliers, not core value
- [Research]: Fan-out-on-write feed architecture from day one to avoid naive query degradation
- [Research]: Async media processing via BullMQ workers mandatory from Phase 1
- [01-01]: Source-only shared package -- TypeScript source imported directly by consuming workspace tooling
- [01-01]: Vietnamese error messages in Zod schemas per user decision
- [01-01]: Dual .env loading for monorepo Prisma CLI compatibility
- [01-01]: Named throttle profiles (short: 100/min, login: 5/min)
- [01-02]: Argon2 for passwords/refresh tokens, SHA-256 for single-use verification/reset tokens
- [01-02]: HTML email templates as TypeScript functions (not React Email JSX) for NestJS compatibility
- [01-02]: OAuth account linking: match by provider ID, then email, then create new
- [01-02]: Refresh token rotation with stolen token detection (invalidate all on mismatch)
- [Phase 01-03]: Removed EmailVerifiedGuard from /me so frontend can distinguish unverified from unauthenticated
- [Phase 01-03]: /me returns full PublicUser object for frontend display
- [Phase 01-03]: Queue pattern for concurrent 401 refresh: only one refresh in flight
- [02-01]: Username nullable on User model to support existing OAuth users without usernames
- [02-01]: Reserved username check in AuthService (not Zod schema) to separate validation from business logic
- [02-01]: P2002 catch on signup for username race condition handling
- [02-01]: avatarId @unique for Prisma one-to-one relation requirement

### Pending Todos

None yet.

### Blockers/Concerns

- [Research]: Seed data strategy for collection database (Gundam, figurines, sneakers) needs resolution before Phase 4
- [Research]: Video processing cost analysis (self-hosted FFmpeg vs AWS MediaConvert) needed before Phase 10

## Session Continuity

Last session: 2026-03-13T20:55:51Z
Stopped at: Completed 02-01 Schema & Shared Types
Resume file: .planning/phases/02-profiles-social-graph/02-02-PLAN.md
