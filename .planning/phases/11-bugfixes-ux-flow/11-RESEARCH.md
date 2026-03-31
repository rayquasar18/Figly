# Phase 11: Bugfixes & UX Flow - Research

**Researched:** 2026-03-22
**Domain:** Auth flow simplification, profile completion bugfixes, desktop navigation layout
**Confidence:** HIGH

## Summary

Phase 11 addresses five concrete bugs/gaps in the existing Figly codebase. The changes span the full stack (Prisma schema, backend DTOs + service, shared Zod schemas, frontend forms + layout) but are all surgical edits to existing, well-structured code. No new libraries are needed.

The core challenge is a multi-layer validation chain: shared Zod schema -> backend class-validator DTO -> Prisma schema -> frontend form. All four layers must be updated in lock-step for BUGF-01/BUGF-02. The redirect loop fix (BUGF-03) requires React Query cache invalidation after profile completion. The explore page issue (BUGF-04) is likely caused by `PostAuthor.username` being typed as non-nullable `string` while the database allows `null` -- posts from OAuth users without usernames would produce `null` in the API response, potentially crashing rendering. The desktop sidebar (BUGF-05) is a new UI component following the established `BottomNav` pattern.

**Primary recommendation:** Fix all five issues in dependency order: schema/DTO changes first (BUGF-01 + BUGF-02), then Prisma migration, then complete-profile cache fix (BUGF-03), then explore page (BUGF-04), then sidebar (BUGF-05). Always rebuild Docker after changes per project convention.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Signup form collects only email and password -- remove name and username fields from the registration form
- D-02: Backend SignupDto accepts only email and password -- name and username become optional/removed from signup endpoint
- D-03: Shared `signupSchema` (Zod) updated to only require email and password
- D-04: Backend `auth.dto.ts` (class-validator) updated to match -- name and username removed from SignupDto
- D-05: Prisma schema changes `name` from `String` (NOT NULL) to `String?` (nullable)
- D-06: At signup, user is created with `name: null` and `username: null`
- D-07: Existing users are unaffected -- migration preserves their current name values
- D-08: Flow is: Signup -> verify email -> forced to /complete-profile -> then can use app
- D-09: The existing username gate in `(app)/layout.tsx` handles this automatically -- users without username are redirected to /complete-profile
- D-10: Same flow applies to both email/password and OAuth users
- D-11: Complete-profile page requires both username AND display name (both mandatory)
- D-12: The existing `displayName` field on the complete-profile form becomes required (remove `.optional()`)
- D-13: Display name saves to the `name` column in the database
- D-14: After complete-profile form submits successfully, invalidate the `['auth', 'me']` React Query cache before redirecting to homepage
- D-15: This ensures the `(app)/layout.tsx` username gate sees the updated user data and doesn't redirect back
- D-16: Debug and fix whatever runtime error prevents explore page from loading -- the component code looks structurally sound, likely a data/API issue
- D-17: Add Instagram-style left sidebar visible on `md:` breakpoint and above
- D-18: Sidebar navigation links: Home, Search, Explore, Reels, Create, Profile
- D-19: Bottom nav remains for mobile (`md:hidden`), sidebar for desktop (`hidden md:block`)

### Claude's Discretion
- Sidebar width, icon style, and whether it's icon-only or icon+label (follow Instagram pattern)
- Exact fix for explore page runtime issue (depends on debugging)
- Loading and error state handling during complete-profile submission
- Whether the header bar changes on desktop when sidebar is present

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BUGF-01 | Signup form only requires email and password (remove name and username fields) | Full code audit of signup-form.tsx, shared signupSchema, and form defaultValues confirms exact fields to remove |
| BUGF-02 | Backend signup endpoint accepts registration without username/name (make fields optional) | Audited auth.dto.ts (class-validator), auth.service.ts signup(), auth.controller.ts signup() -- all touch points identified including email service name parameter |
| BUGF-03 | Complete-profile page properly redirects to homepage after username is set | Identified root cause: useUpdateProfile invalidates `['profile']` queries but NOT `['auth', 'me']` -- the layout gate reads from `useMe()` which stays stale |
| BUGF-04 | Explore page loads and displays content correctly | Identified likely root cause: `PostAuthor.username` typed as `string` but database allows `null` for users without username -- `post.author.username` renders null in Link href, potentially crashing |
| BUGF-05 | Desktop layout has Instagram-style left sidebar navigation | Audited BottomNav component pattern, (app)/layout.tsx structure, and established icon/link patterns for reuse |
</phase_requirements>

## Standard Stack

### Core (already in use -- no additions needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 14.2.x | Frontend framework | Already in use, route groups `(auth)/(app)/(public)` |
| NestJS | 10.x | Backend framework | Already in use, controller/service/dto pattern |
| Prisma | Current | ORM + migrations | Already in use, `schema.prisma` defines User model |
| React Hook Form | Current | Form management | Already in use in signup-form and complete-profile-form |
| Zod | Current | Shared validation | Already in use in `@figly/shared` auth schemas |
| class-validator | Current | Backend DTO validation | Already in use in backend DTOs (will be unified in Phase 13) |
| @tanstack/react-query | Current | Server state management | Already in use for `useMe()`, `useUpdateProfile()` |
| Zustand | Current | Client state (auth store) | Already in use via `useAuthStore` |
| Tailwind CSS | Current | Styling | Already in use throughout |
| Lucide React | Current | Icons | Already in use in BottomNav, forms |

### Alternatives Considered
None -- this phase uses only existing libraries. No new dependencies.

## Architecture Patterns

### Existing Project Structure (relevant files)
```
packages/shared/src/
  dto/auth.dto.ts              # signupSchema Zod + exported types
  validators/username.ts       # usernameSchema reused in forms
  types/user.types.ts          # PublicUser interface
  types/post.types.ts          # PostAuthor.username: string (BUG)

backend/src/auth/
  dto/auth.dto.ts              # SignupDto (class-validator)
  auth.service.ts              # signup() method
  auth.controller.ts           # POST /auth/signup endpoint
  __tests__/                   # Existing spec files

backend/prisma/
  schema.prisma                # User.name: String (NOT NULL currently)

frontend/src/
  components/auth/signup-form.tsx
  components/profile/complete-profile-form.tsx
  components/layout/bottom-nav.tsx
  app/(app)/layout.tsx         # Username gate + main layout
  app/(app)/complete-profile/page.tsx
  app/(public)/explore/page.tsx
  app/(public)/layout.tsx
  hooks/queries/auth-queries.ts    # useMe, useSignupMutation
  hooks/queries/profile-queries.ts # useUpdateProfile, useCheckUsername
  stores/auth-store.ts             # Zustand auth store
```

### Pattern 1: Dual Validation Chain
**What:** Shared Zod schema validates on frontend; class-validator DTO validates on backend. Both must match.
**When to use:** Every DTO change in this phase.
**Current state:**
- `packages/shared/src/dto/auth.dto.ts` -- Zod `signupSchema` with `name` + `username` required
- `backend/src/auth/dto/auth.dto.ts` -- class-validator `SignupDto` with `name` + `username` required
- Both must be updated to remove `name` and `username` from signup

### Pattern 2: Username Gate (Existing)
**What:** `(app)/layout.tsx` checks `!user.username` via `useMe()` and redirects to `/complete-profile`.
**When to use:** Already handles the post-signup force-redirect. No changes needed to the gate itself.
**Key insight:** The gate reads from React Query cache key `['auth', 'me']`. If this cache is stale after profile completion, the redirect loop occurs.

### Pattern 3: BottomNav Reuse for Sidebar
**What:** The `BottomNav` component defines the nav link pattern with `NavLink` helper, icons, and active state detection.
**When to use:** Sidebar should follow the same pattern with the same nav items.
**Current items in BottomNav:** Home (`/`), Reels (`/reels`), Collection (`/collection`), Create (button), Profile (`/${username}`)
**Required sidebar items per BUGF-05:** Home, Search, Explore, Reels, Create, Profile

### Anti-Patterns to Avoid
- **Updating only one layer of the validation chain:** Must update shared Zod, backend class-validator, frontend form, and type signatures simultaneously
- **Using `router.push` after profile update without cache invalidation:** Causes redirect loop because `useMe()` still returns stale data with `username: null`
- **Assuming `PostAuthor.username` is always a string:** The database allows `null` for username, so API responses may contain `null` even though the TypeScript type says `string`

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Username availability check | Custom debounce logic | Existing `useCheckUsername` hook | Already built with 300ms debounce, Loader2 spinner, Check/X icons |
| Form validation | Manual validation | `zodResolver` + React Hook Form | Existing pattern in both signup and complete-profile forms |
| Auth state propagation | Manual state sync | `queryClient.invalidateQueries` + Zustand `setUser` | Both patterns already exist in `useLoginMutation` and `useUpdateProfile` |

## Common Pitfalls

### Pitfall 1: Prisma Migration with Existing Data
**What goes wrong:** Changing `name String` to `name String?` could fail if migration attempts to add a NOT NULL constraint or if the migration direction is wrong.
**Why it happens:** Prisma migrations are directional. Making a field nullable is safe (no data loss), but the migration SQL must be correct.
**How to avoid:** Use `npx prisma migrate dev --name make-name-nullable`. Prisma handles `ALTER TABLE users ALTER COLUMN name DROP NOT NULL` automatically. Verify with `npx prisma migrate status`.
**Warning signs:** Migration fails or existing user records show unexpected values.

### Pitfall 2: Email Verification Template with Null Name
**What goes wrong:** After making `name` nullable, `auth.controller.ts:36` calls `sendVerificationEmail(user.id, user.email, user.name)` where `user.name` is now `null`. The email template uses `escapeHtml(name)` which will crash or display "null".
**Why it happens:** The signup endpoint creates users with `name: null` but still sends verification email immediately after.
**How to avoid:** Pass a fallback: `user.name || 'ban'` (Vietnamese for "you") or `user.name || user.email.split('@')[0]`. Same applies to `resendVerification` endpoint.
**Warning signs:** Email sending fails or emails show "null" as greeting.

### Pitfall 3: React Query Cache Stale After Profile Update
**What goes wrong:** User completes profile, gets redirected to `/`, but `useMe()` still returns `{ username: null }` because its cache (`['auth', 'me']`) hasn't been invalidated. The username gate in `(app)/layout.tsx` sees `!user.username` and redirects back to `/complete-profile` -- infinite loop.
**Why it happens:** `useUpdateProfile` in `profile-queries.ts` only invalidates `['profile']` queries (line 45), not `['auth', 'me']`. The Zustand store IS updated (line 48-52), but the layout reads from `useMe()` which is a React Query hook with 5-minute stale time.
**How to avoid:** In the complete-profile form's `onSubmit`, after successful mutation, call `queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })` before `router.replace('/')`. Or add `['auth', 'me']` invalidation to `useUpdateProfile`'s `onSuccess` handler.
**Warning signs:** Redirect loop after completing profile.

### Pitfall 4: PostAuthor.username Type Mismatch
**What goes wrong:** `PostAuthor` interface declares `username: string` but the database allows `null`. Posts by users without usernames (OAuth users who haven't completed profile) produce API responses with `username: null`. The frontend renders `<Link href={\`/${null}\`}>` which navigates to "/null".
**Why it happens:** Type definition in `packages/shared/src/types/post.types.ts` line 12 says `username: string` but `User.username` in Prisma is `String?`.
**How to avoid:** Either (a) update `PostAuthor.username` to `string | null` and handle null in rendering, or (b) filter out posts from users without usernames in the public feed query (`where: { user: { username: { not: null } } }`). Option (b) is cleaner since incomplete-profile users shouldn't have public posts anyway.
**Warning signs:** Explore page crashes, links to "/null" profile.

### Pitfall 5: OAuth Signup Path Creates User with name: String
**What goes wrong:** `handleGoogleLogin` (line 391) and `handleAppleLogin` (line 429) create users with `name: profile.name` which is always provided by Google/Apple. This is fine, but after making `name` nullable for email signup, these paths should remain consistent.
**Why it happens:** OAuth and email signup have separate code paths.
**How to avoid:** Leave OAuth paths unchanged -- they correctly set `name` from the provider. Only email signup path changes to `name: null`.
**Warning signs:** None if left alone, but double-check OAuth still works after Prisma migration.

### Pitfall 6: Frontend useSignupMutation Type Signature
**What goes wrong:** `useSignupMutation` in `auth-queries.ts:47` has `mutationFn` typed as `(data: { email: string; password: string; name: string; username: string })`. After removing name/username from signup, this type must shrink to `{ email: string; password: string }`.
**Why it happens:** The mutation type is manually declared, not derived from the shared schema.
**How to avoid:** Update the type to `{ email: string; password: string }` or, better, import `SignupDto` from `@figly/shared` (which will be `{ email: string; password: string }` after the Zod schema change).
**Warning signs:** TypeScript compile errors after shared schema change.

## Code Examples

### Example 1: Updated Shared signupSchema
```typescript
// packages/shared/src/dto/auth.dto.ts
export const signupSchema = z.object({
  email: z.string().email({ message: 'Email khong hop le' }),
  password: passwordSchema,
  // name and username REMOVED -- set during complete-profile
});
```

### Example 2: Updated Backend SignupDto
```typescript
// backend/src/auth/dto/auth.dto.ts
export class SignupDto {
  @IsEmail({}, { message: 'Email khong hop le' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Mat khau phai co it nhat 8 ky tu' })
  @Matches(/[a-zA-Z]/, { message: 'Mat khau phai chua chu cai' })
  @Matches(/[0-9]/, { message: 'Mat khau phai chua so' })
  password!: string;

  // name and username REMOVED
}
```

### Example 3: Updated auth.service.ts signup()
```typescript
// backend/src/auth/auth.service.ts
async signup(dto: { email: string; password: string }) {
  // Check email uniqueness
  const existing = await this.prisma.user.findUnique({
    where: { email: dto.email },
  });
  if (existing) {
    throw new ConflictException('Email da duoc su dung');
  }

  // No username check needed -- username set later in complete-profile
  const passwordHash = await argon2.hash(dto.password);

  const user = await this.prisma.user.create({
    data: {
      email: dto.email,
      passwordHash,
      name: null,       // Set during complete-profile
      username: null,    // Set during complete-profile
      emailVerified: false,
    },
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return user;
}
```

### Example 4: Complete-profile cache invalidation fix
```typescript
// frontend/src/components/profile/complete-profile-form.tsx
import { useQueryClient } from '@tanstack/react-query';

// Inside CompleteProfileForm:
const queryClient = useQueryClient();

async function onSubmit(data: CompleteProfileForm) {
  try {
    await updateProfile.mutateAsync({
      username: data.username,
      displayName: data.displayName,  // Now required, not optional
    });
    // CRITICAL: Invalidate auth cache so layout username gate sees updated data
    await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    toast.success('Ho so da duoc cap nhat');
    router.replace('/');
  } catch (error: unknown) {
    // ... error handling
  }
}
```

### Example 5: Desktop Sidebar Component
```typescript
// frontend/src/components/layout/sidebar.tsx
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Home, Search, Compass, Clapperboard,
  PlusSquare, User,
} from 'lucide-react';
import { useMe } from '@/hooks/queries/auth-queries';
import { useCreatePostStore } from '@/stores/create-post-store';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  const { data: user } = useMe();
  const openCreatePost = useCreatePostStore((s) => s.open);
  const profileHref = user?.username ? `/${user.username}` : '/';

  const links = [
    { href: '/', icon: Home, label: 'Trang chu', isActive: pathname === '/' },
    { href: '/search', icon: Search, label: 'Tim kiem', isActive: pathname === '/search' },
    { href: '/explore', icon: Compass, label: 'Kham pha', isActive: pathname === '/explore' },
    { href: '/reels', icon: Clapperboard, label: 'Reels', isActive: pathname.startsWith('/reels') },
    { href: profileHref, icon: User, label: 'Ho so', isActive: !!user?.username && pathname.startsWith(`/${user.username}`) },
  ];

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-dvh w-[220px] border-r bg-background md:block">
      <div className="flex h-full flex-col px-3 py-6">
        <Link href="/" className="mb-8 px-3 text-xl font-bold">Figly</Link>
        <nav className="flex flex-1 flex-col gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors',
                link.isActive
                  ? 'font-semibold text-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
              aria-label={link.label}
            >
              <link.icon className={cn('size-6', link.isActive && 'fill-current')} />
              <span>{link.label}</span>
            </Link>
          ))}
          <button
            type="button"
            onClick={openCreatePost}
            className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Tao bai viet"
          >
            <PlusSquare className="size-6" />
            <span>Tao moi</span>
          </button>
        </nav>
      </div>
    </aside>
  );
}
```

### Example 6: Updated (app)/layout.tsx with Sidebar
```typescript
// frontend/src/app/(app)/layout.tsx -- relevant changes
import { Sidebar } from '@/components/layout/sidebar';

// In the return JSX:
return (
  <>
    <Sidebar />
    <div className="md:ml-[220px]">
      {!hideHeader && (
        <header className="sticky top-0 z-40 border-b bg-background">
          {/* ... existing header ... */}
        </header>
      )}
      <main className="pb-14 md:pb-0">{children}</main>
    </div>
    <BottomNav />
    <CreatePostFlow />
    <CreateReelFlow />
  </>
);
```

## Detailed Root Cause Analysis

### BUGF-03: Redirect Loop Root Cause
**The bug chain:**
1. User submits complete-profile form
2. `useUpdateProfile.mutateAsync()` succeeds
3. `onSuccess` in `useUpdateProfile` invalidates `['profile']` queries and updates Zustand store
4. BUT `['auth', 'me']` is NOT invalidated (5-minute stale time)
5. `router.replace('/')` navigates to homepage
6. `(app)/layout.tsx` renders, calls `useMe()` which returns STALE cached data with `username: null`
7. Username gate triggers: `!user.username` -> `router.replace('/complete-profile')`
8. Loop repeats

**The fix:** Add `queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })` after the mutation succeeds, BEFORE navigating. This forces `useMe()` to refetch, and the layout gate will see the updated username.

### BUGF-04: Explore Page Likely Root Cause
**Investigation findings:**
1. The explore page uses `usePublicFeed()` which calls `GET /feed/public`
2. The public feed endpoint works without authentication (no guard)
3. The feed service maps posts via `mapPostResponse` which reads `post.user.username`
4. If a user has `username: null`, the API response includes `author: { username: null }`
5. The `PostAuthor` TypeScript type says `username: string` (not nullable)
6. `PostCard` renders `<Link href={\`/${post.author.username}\`}>` -- with null this becomes "/null"
7. This could cause a runtime error or just broken links

**Additional potential issue:** If no posts exist at all, the page shows "Chua co bai viet nao" which works fine. The error likely only manifests when there ARE posts from users without usernames.

**Two-pronged fix:** (a) In the public feed query, add `where: { user: { username: { not: null } } }` to filter out posts from incomplete-profile users, AND (b) update `PostAuthor.username` to `string | null` for type safety.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Signup requires all fields upfront | Two-step: email+password then complete-profile | This phase | Reduces signup friction, matches Instagram/Twitter pattern |
| Mobile-only bottom nav | Bottom nav (mobile) + sidebar (desktop) | This phase | Desktop UX matches Instagram standard |
| Profile update without auth cache invalidation | Invalidate `['auth', 'me']` after profile changes | This phase | Prevents redirect loops |

## Open Questions

1. **Explore page actual error**
   - What we know: The component code is structurally sound, uses `usePublicFeed()` which hits an unguarded endpoint. The `PostAuthor.username` type mismatch is a likely candidate.
   - What's unclear: Whether the actual error is a type mismatch, an API error, or something else entirely. Need to run the app and check browser console.
   - Recommendation: During implementation, start Docker, navigate to `/explore`, check browser DevTools console/network tab. The fix will become clear from the error message. If it's the username null issue, filter posts or add null handling.

2. **Header behavior with sidebar on desktop**
   - What we know: Current header is a sticky top bar with "Figly" logo and search icon. With a sidebar, the logo moves to the sidebar.
   - What's unclear: Whether to keep the header on desktop (redundant search icon?) or simplify/remove it.
   - Recommendation: Keep the header on desktop but remove the "Figly" text (it's in the sidebar). Keep the search icon for quick access. Or, per Claude's discretion, hide header on desktop entirely since Search is in the sidebar.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.x with ts-jest |
| Config file | `backend/jest.config.ts` |
| Quick run command | `cd backend && npx jest --testPathPattern="auth" --no-coverage` |
| Full suite command | `cd backend && npx jest --no-coverage` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BUGF-01 | Shared signupSchema accepts only email+password | unit | `cd backend && npx jest --testPathPattern="signup-username" --no-coverage` | Needs update (existing tests assert old schema) |
| BUGF-02 | AuthService.signup() creates user with null name/username | unit | `cd backend && npx jest --testPathPattern="auth.service" --no-coverage` | Needs update (existing tests pass name+username) |
| BUGF-03 | Complete-profile redirects to homepage without loop | manual-only | Manual: signup new user, complete profile, verify no redirect loop | N/A -- frontend behavior test, no backend test infrastructure |
| BUGF-04 | Explore page loads public feed without errors | unit | `cd backend && npx jest --testPathPattern="public-feed" --no-coverage` | Exists: `backend/src/feed/__tests__/public-feed.spec.ts` |
| BUGF-05 | Desktop sidebar renders with correct nav links | manual-only | Manual: verify sidebar visible at md breakpoint, all links work | N/A -- no frontend component test infrastructure |

### Sampling Rate
- **Per task commit:** `cd backend && npx jest --no-coverage` (runs in ~10-15 seconds)
- **Per wave merge:** Full backend test suite + Docker rebuild and manual smoke test
- **Phase gate:** Full suite green + Docker containers running + manual flow verification

### Wave 0 Gaps
- [ ] Update `backend/src/auth/__tests__/auth.service.spec.ts` -- existing `signupDto` includes `name` and `username`, must change to email+password only
- [ ] Update `backend/src/auth/__tests__/signup-username.spec.ts` -- tests assert username in signup response, must update for new flow where signup returns null username
- [ ] Add test case: signup creates user with `name: null, username: null`
- [ ] Verify `backend/src/feed/__tests__/public-feed.spec.ts` covers posts with null-username authors

## Sources

### Primary (HIGH confidence)
- Direct code audit of all files listed in CONTEXT.md canonical references
- Prisma schema: `backend/prisma/schema.prisma` -- User model field types verified
- TypeScript types: `packages/shared/src/types/` -- PostAuthor.username type mismatch identified
- React Query hooks: `frontend/src/hooks/queries/` -- cache invalidation patterns verified
- Existing test files: `backend/src/auth/__tests__/` -- test patterns and mocking approach documented

### Secondary (MEDIUM confidence)
- Email template null-name issue: inferred from code path analysis (auth.controller.ts:36 -> email.service.ts:19 -> verification.ts:26)
- Explore page root cause: inferred from type analysis (PostAuthor.username: string vs User.username: String?)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, all existing tools
- Architecture: HIGH -- direct code audit of every file involved
- Pitfalls: HIGH -- root cause analysis based on code paths, not speculation
- Explore page fix: MEDIUM -- root cause inferred from type analysis, needs runtime verification

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable codebase, no external dependency changes)
