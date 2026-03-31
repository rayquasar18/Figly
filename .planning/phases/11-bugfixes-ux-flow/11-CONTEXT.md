# Phase 11: Bugfixes & UX Flow - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix broken registration flow (simplify signup to email+password only), fix complete-profile redirect loop, fix explore page loading issues, and add Instagram-style desktop sidebar navigation. Users can register, complete their profile, and navigate the app without broken flows or layout issues.

</domain>

<decisions>
## Implementation Decisions

### Signup form simplification
- **D-01:** Signup form collects only email and password — remove name and username fields from the registration form
- **D-02:** Backend SignupDto accepts only email and password — name and username become optional/removed from signup endpoint
- **D-03:** Shared `signupSchema` (Zod) updated to only require email and password
- **D-04:** Backend `auth.dto.ts` (class-validator) updated to match — name and username removed from SignupDto

### Database migration for name field
- **D-05:** Prisma schema changes `name` from `String` (NOT NULL) to `String?` (nullable)
- **D-06:** At signup, user is created with `name: null` and `username: null`
- **D-07:** Existing users are unaffected — migration preserves their current name values

### Post-signup flow
- **D-08:** Flow is: Signup -> verify email -> forced to /complete-profile -> then can use app
- **D-09:** The existing username gate in `(app)/layout.tsx` handles this automatically — users without username are redirected to /complete-profile
- **D-10:** Same flow applies to both email/password and OAuth users

### Complete-profile page enhancements
- **D-11:** Complete-profile page requires both username AND display name (both mandatory)
- **D-12:** The existing `displayName` field on the complete-profile form becomes required (remove `.optional()`)
- **D-13:** Display name saves to the `name` column in the database

### Auth cache invalidation fix (BUGF-03)
- **D-14:** After complete-profile form submits successfully, invalidate the `['auth', 'me']` React Query cache before redirecting to homepage
- **D-15:** This ensures the `(app)/layout.tsx` username gate sees the updated user data and doesn't redirect back

### Explore page fix (BUGF-04)
- **D-16:** Debug and fix whatever runtime error prevents explore page from loading — the component code looks structurally sound, likely a data/API issue

### Desktop sidebar navigation (BUGF-05)
- **D-17:** Add Instagram-style left sidebar visible on `md:` breakpoint and above
- **D-18:** Sidebar navigation links: Home, Search, Explore, Reels, Create, Profile
- **D-19:** Bottom nav remains for mobile (`md:hidden`), sidebar for desktop (`hidden md:block`)

### Claude's Discretion
- Sidebar width, icon style, and whether it's icon-only or icon+label (follow Instagram pattern)
- Exact fix for explore page runtime issue (depends on debugging)
- Loading and error state handling during complete-profile submission
- Whether the header bar changes on desktop when sidebar is present

</decisions>

<specifics>
## Specific Ideas

- Follow Instagram's pattern: sidebar on desktop, bottom nav on mobile — same navigation items in both
- Signup should feel frictionless — just email and password, everything else comes after verification
- Complete-profile is a gate, not optional — every user must have a username and display name before accessing the app

</specifics>

<canonical_refs>
## Canonical References

No external specs — requirements are fully captured in decisions above and in:

### Requirements
- `.planning/REQUIREMENTS.md` — BUGF-01 through BUGF-05 define the scope

### Existing code to modify
- `frontend/src/components/auth/signup-form.tsx` — Signup form with name+username fields to remove
- `frontend/src/app/(auth)/signup/page.tsx` — Signup page wrapper
- `backend/src/auth/dto/auth.dto.ts` — Backend SignupDto (class-validator) with name+username to remove
- `backend/src/auth/auth.service.ts:30` — signup() method expects `{ email, password, name, username }`
- `backend/src/auth/auth.controller.ts:33` — signup endpoint
- `packages/shared/src/dto/auth.dto.ts:11` — Shared signupSchema (Zod) with name+username to remove
- `frontend/src/hooks/queries/auth-queries.ts:47` — useSignupMutation type signature
- `frontend/src/components/profile/complete-profile-form.tsx` — Make displayName required
- `frontend/src/app/(app)/layout.tsx` — App layout (add sidebar, keep username gate)
- `frontend/src/components/layout/bottom-nav.tsx` — Mobile bottom nav (reference for sidebar items)
- `frontend/src/app/(public)/explore/page.tsx` — Explore page to debug
- `backend/prisma/schema.prisma:25` — User.name field to make nullable

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `BottomNav` component: Has the nav link pattern and items — sidebar can reuse the same NavLink approach
- `CompleteProfileForm`: Already has username field with availability check and debounce — just needs displayName made required
- `useMe()` hook + `useAuthStore`: Auth state management already in place
- `useCheckUsername` hook: Username availability check with debounce already built

### Established Patterns
- Route groups: `(auth)` for login/signup, `(app)` for authenticated, `(public)` for public pages
- Username gate: `(app)/layout.tsx` checks `!user.username` and redirects to `/complete-profile`
- Email verification gate: Both `(app)` and `(public)` layouts redirect unverified users
- Zod schemas in shared package + class-validator DTOs in backend (dual validation — Phase 13 will unify)
- Vietnamese UI messages throughout

### Integration Points
- Shared package `signupSchema` is imported by frontend signup form — must stay in sync
- Backend `SignupDto` (class-validator) is separate from shared Zod schema — both need updating
- `useSignupMutation` type signature must match new schema
- React Query cache key `['auth', 'me']` must be invalidated after profile completion
- Desktop sidebar will be added to `(app)/layout.tsx` — affects all authenticated pages

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 11-bugfixes-ux-flow*
*Context gathered: 2026-03-22*
