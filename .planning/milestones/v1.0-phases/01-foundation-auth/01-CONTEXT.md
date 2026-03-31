# Phase 1: Foundation & Auth - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Scaffold the Turborepo monorepo (frontend/ + backend/ + packages/shared/), set up PostgreSQL database with Prisma ORM, implement async media pipeline with MinIO, and build a complete authentication system (email/password + Google OAuth + Apple Sign-In) with email verification and password reset. Next.js is strictly frontend-only (no API routes for business logic), NestJS handles all backend logic.

</domain>

<decisions>
## Implementation Decisions

### Project Structure
- Turborepo + pnpm workspaces as monorepo tool
- Folder layout: `frontend/` (Next.js), `backend/` (NestJS), `packages/shared/` (types, DTOs, constants, validators)
- Next.js is STRICTLY frontend only — no API routes, no server actions for business logic
- NestJS handles ALL business logic, database, auth, media processing
- Tailwind CSS for styling
- shadcn/ui for component library
- Zustand for client state management
- TanStack Query for data fetching and API client

### Auth Experience
- Block user until email is verified — no access to app before verification
- Login error messages are specific: "Email không tồn tại" or "Sai mật khẩu" (not vague)
- Login/signup UI layout and OAuth button placement: Claude's discretion

### Session Handling
- JWT + Refresh token strategy
- Tokens stored in HttpOnly cookies (not localStorage) — XSS protection
- Multi-device login allowed (like Instagram)
- Always logged in — refresh token ~30 days, no "remember me" checkbox
- Logout only affects current device
- Rate limit: 5 failed login attempts per minute, then temporary lock

### Email & Recovery
- Resend as email service
- Password reset via email link (not OTP code)
- Branded HTML email templates using React Email (Figly logo, brand colors)
- Token expiry: 24 hours for email verification, 1 hour for password reset

### Media Pipeline
- MinIO for storage (S3-compatible, runs locally via Docker, production-ready swap to S3/R2)
- Upload flow: browser → NestJS backend (validation, auth, metadata) → MinIO
- Async image processing via BullMQ workers (Sharp)
- File size limits: 10MB for images, 100MB for videos
- 3 thumbnail sizes: 150px (thumbnail), 600px (medium), 1080px (large)

### Security Baseline
- Password policy: minimum 8 characters, must contain letters and numbers
- Password hashing: Argon2 (OWASP recommended)
- CORS: strict — only allow frontend domain
- Rate limiting: 100 requests/minute for general API, 5/minute for login endpoint

### Claude's Discretion
- Login/signup page layout (single page with toggle vs separate pages)
- OAuth button placement (above or below email/password form)
- Loading states and error UI design
- Exact Turborepo task pipeline configuration
- Docker Compose setup for dev environment (PostgreSQL, MinIO, Redis)
- Database seeding approach for dev

</decisions>

<specifics>
## Specific Ideas

- Folder naming must be `frontend/` and `backend/` — not `apps/web` and `apps/api`. User wants clarity and separation.
- Strict separation: Next.js must NEVER contain backend logic. This is a hard rule, not a preference.
- Instagram-like always-logged-in behavior — no session timeouts for active users.
- Production-ready from start — MinIO chosen specifically because the code won't need to change when switching to S3/R2 in production.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing code

### Established Patterns
- None yet — Phase 1 establishes all patterns

### Integration Points
- packages/shared will be imported by both frontend and backend
- Turborepo manages build/dev pipeline across all workspaces
- MinIO (Docker) connects to NestJS media module
- PostgreSQL (Docker) connects to NestJS via Prisma
- Redis (Docker) serves as BullMQ job queue backend

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-auth*
*Context gathered: 2026-03-13*
