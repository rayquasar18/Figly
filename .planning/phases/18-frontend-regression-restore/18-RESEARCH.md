# Phase 18: Frontend Regression Restore - Research

**Researched:** 2026-03-26
**Domain:** Next.js Server Components, React 19 ref-as-prop migration, frontend import restructure
**Confidence:** HIGH

## Summary

Phase 18 is a gap-closure phase that restores frontend work lost during the Phase 15-01 ESLint/Prettier worktree merge. The merge reverted 17 page.tsx files back to their pre-Phase-14 state (with `'use client'`, old `@/components/*` and `@/hooks/queries/*` import paths, and no metadata exports). It also reverted all 19 shadcn/ui component files back to their pre-Phase-12 state (using `React.forwardRef` instead of React 19 ref-as-prop). Additionally, 6 feature component files inside `features/` still have stale `@/stores/*` and `@/hooks/queries/*` imports, and the `useSignupMutation` type signature is stale (expects `name` and `username` fields that were removed in Phase 11).

The good news: all client wrapper files (`*-page-client.tsx`) created by Phase 14-03 and 14-04 survived the merge and already use correct `@/features/*` barrel imports. The fix is mechanical: replace each broken page.tsx with its correct Server Component version that delegates to the existing client wrapper.

**Primary recommendation:** Replace all 17 broken page.tsx files with Server Component versions (metadata + async function + client wrapper import), fix 6 stale imports in features/ components, remove forwardRef from all 19 UI components, and fix the signup mutation type signature.

<phase_requirements>

## Phase Requirements

| ID      | Description                                                               | Research Support                                                                                                           |
| ------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| FRMW-01 | React upgraded from v18 to v19 with all breaking changes resolved         | forwardRef removal from 19 UI components restores React 19 ref-as-prop pattern from Phase 12-02                            |
| FRMW-02 | Next.js upgraded from v14 to v16 with async API migrations complete       | Server Component page.tsx files use async params with await, metadata/generateMetadata exports                             |
| FRNT-01 | Frontend directory restructured to features/ pattern                      | Fixing 6 stale imports in features/ components to use barrel exports instead of old @/hooks/queries/_ and @/stores/_ paths |
| FRNT-03 | Public routes rendered as Server Components with generateMetadata for SEO | Restoring 17 page.tsx files as Server Components with metadata exports                                                     |

</phase_requirements>

## Standard Stack

No new libraries needed. This phase restores existing patterns using the current stack.

### Core (Already Installed)

| Library               | Version | Purpose                           | Status                                 |
| --------------------- | ------- | --------------------------------- | -------------------------------------- |
| react                 | ^19.2.0 | UI framework with ref-as-prop     | Installed, forwardRef removal needed   |
| next                  | ^16.2.0 | App Router with Server Components | Installed, page.tsx restoration needed |
| @tanstack/react-query | ^5.62.0 | Client-side data fetching         | Installed, used by client wrappers     |

## Architecture Patterns

### Pattern 1: Server Component Page with Client Extraction

Every page.tsx is an async Server Component. Interactive logic lives in a sibling `*-page-client.tsx` file.

**Working reference:** `frontend/src/app/(app)/page.tsx` (feed page - already correct)

```typescript
// page.tsx — Server Component (NO 'use client')
import type { Metadata } from 'next';
import { fetchApi } from '@/lib/server-fetch';
import { FeedPageClient } from './feed-page-client';

export const metadata: Metadata = {
  title: 'Trang chu | Figly',
  description: 'Xem bai viet moi nhat tu nhung nguoi ban theo doi tren Figly',
};

export default async function FeedPage() {
  await fetchApi('/feed?limit=20');
  return <FeedPageClient />;
}
```

```typescript
// feed-page-client.tsx — Client Component
'use client';
import { useFeed, PostCard } from '@/features/post';
import { FeedList } from '@/features/feed';
// ... interactive logic with hooks, state, effects
```

**Key rules:**

- page.tsx: NO `'use client'`, has `metadata` or `generateMetadata`, `async function`, imports from `@/features/*` barrel or renders `*PageClient`
- client wrapper: HAS `'use client'`, contains all hooks/state/effects, imports from `@/features/*` barrels

### Pattern 2: Dynamic Metadata with generateMetadata

For pages with dynamic content (profile, post, item, series), use `generateMetadata` with server-side fetch.

**Working reference:** Phase 14-03 summary documents this pattern. The client wrapper files already exist.

```typescript
// page.tsx for dynamic route
import type { Metadata } from 'next';
import { fetchApi } from '@/lib/server-fetch';
import ProfilePageClient from './profile-page-client';

function toAbsoluteUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
  return `${base.replace('/api', '')}${path}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const profile = await fetchApi<ProfileResponse>(`/profiles/${username}`);
  // return Metadata object with title, description, openGraph, twitter
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const initialProfile = await fetchApi<ProfileResponse>(`/profiles/${username}`);
  return <ProfilePageClient username={username} initialProfile={initialProfile} />;
}
```

### Pattern 3: React 19 ref-as-prop (No forwardRef)

Replace `React.forwardRef<Element, Props>((props, ref) => ...)` with function that accepts ref as a prop.

**Source:** `.agents/skills/vercel-composition-patterns/rules/react19-no-forwardref.md`

```typescript
// BEFORE (React 18 - forwardRef)
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = 'Button';

// AFTER (React 19 - ref as prop)
function Button({
  className,
  variant,
  size,
  asChild = false,
  ref,
  ...props
}: ButtonProps & { ref?: React.Ref<HTMLButtonElement> }) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  );
}
```

**Key rules:**

- Remove `React.forwardRef<>()` wrapper
- Add `ref?: React.Ref<ElementType>` to props destructuring
- Remove `.displayName` assignment (function declarations auto-provide name)
- Convert from `const Component = ...` to `function Component(...)`

### Pattern 4: Feature Barrel Import Pattern

Components within `features/` must import from sibling paths or barrel exports, NOT from old `@/hooks/queries/*` or `@/stores/*` paths.

```typescript
// WRONG - old paths (pre-Phase-14)
import { useAuthStore } from '@/stores/auth-store';
import { useLikeMutation } from '@/hooks/queries/interaction-queries';

// CORRECT - feature barrel exports
import { useAuthStore } from '@/features/auth';
import { useLikeMutation } from '@/features/post';
// OR relative import within same feature
import { useLikeMutation } from '../hooks/interaction-queries';
```

### Anti-Patterns to Avoid

- **Putting `'use client'` in page.tsx:** Defeats Server Component rendering and SEO metadata
- **Importing from old `@/components/[domain]/` paths:** These directories no longer exist; use `@/features/[domain]` barrel
- **Importing from old `@/hooks/queries/` paths:** These directories no longer exist; use `@/features/[domain]` barrel
- **Importing from old `@/stores/` path:** No longer exists; use `@/features/auth` for `useAuthStore`

## Don't Hand-Roll

| Problem             | Don't Build                         | Use Instead                                                              | Why                                                   |
| ------------------- | ----------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------- |
| Page.tsx content    | Writing new page logic from scratch | Copy pattern from existing working pages (feed, reels, login, signup)    | Client wrapper files already exist with correct logic |
| forwardRef removal  | Manual one-by-one editing           | Systematic pattern: function declaration + ref prop + remove displayName | Phase 12-02 summary documents the exact pattern used  |
| Import path mapping | Guessing where things moved         | Use barrel exports from `@/features/*` index.ts files                    | All barrels already export everything needed          |

## Common Pitfalls

### Pitfall 1: Incomplete Page.tsx Restoration

**What goes wrong:** Some page.tsx files have `generateMetadata` (dynamic) while others have `metadata` (static). Using the wrong one causes build failures.
**Why it happens:** Pages with dynamic routes need `generateMetadata` with `await params`; static pages use `export const metadata`.
**How to avoid:** Check if the route has `[params]` -- if yes, use `generateMetadata`; if no, use static `metadata`.
**Warning signs:** TypeScript errors about `params` type or metadata not being a function.

### Pitfall 2: Suspense Boundary Missing for useSearchParams

**What goes wrong:** verify-email and reset-password pages crash because their client components use `useSearchParams()`.
**Why it happens:** In Next.js App Router, `useSearchParams()` in a Client Component rendered from a Server Component requires a `<Suspense>` boundary.
**How to avoid:** Wrap client components that use `useSearchParams` in `<Suspense>`.
**Warning signs:** Runtime error about missing Suspense boundary.

### Pitfall 3: forwardRef on Radix Primitives

**What goes wrong:** Removing forwardRef from components that wrap Radix primitives can break ref forwarding.
**Why it happens:** Radix components expect ref to be forwarded properly.
**How to avoid:** For Radix wrapper components (Dialog, Popover, etc.), use the same `& { ref?: React.Ref<Element> }` pattern but ensure `ref` is passed to the Radix primitive.
**Warning signs:** Ref is undefined in parent component, focus management breaks.

### Pitfall 4: Cross-Feature Import Cycles

**What goes wrong:** Features importing from other features via old paths creates cycles or build errors.
**Why it happens:** `post-card.tsx` imports `useAuthStore` from `@/stores/auth-store` instead of `@/features/auth`.
**How to avoid:** Always use barrel imports (`@/features/auth`) for cross-feature dependencies.
**Warning signs:** TS2307 "Cannot find module" errors in features/ directory.

### Pitfall 5: useSignupMutation Type Mismatch

**What goes wrong:** `signup-form.tsx` passes `{ email, password }` but `useSignupMutation` expects `{ email, password, name, username }`.
**Why it happens:** Phase 11 simplified signup to email+password only, but auth-queries.ts was regressed back to the old type.
**How to avoid:** Update `useSignupMutation` to accept `{ email: string; password: string }` matching the current `SignupDto` from shared package.
**Warning signs:** TS2345 type assignment error in signup-form.tsx.

## Regression Inventory

### Category 1: Page.tsx Files with 'use client' (17 files)

All need conversion to Server Components. Client wrapper files already exist.

**Public (9 pages):**

| Page                                                       | Client Wrapper                    | Metadata Type                                 |
| ---------------------------------------------------------- | --------------------------------- | --------------------------------------------- |
| `(public)/[username]/page.tsx`                             | `profile-page-client.tsx`         | generateMetadata (dynamic, fetches profile)   |
| `(public)/[username]/followers/page.tsx`                   | `followers-page-client.tsx`       | generateMetadata (dynamic, username in title) |
| `(public)/[username]/following/page.tsx`                   | `following-page-client.tsx`       | generateMetadata (dynamic, username in title) |
| `(public)/post/[postId]/page.tsx`                          | `post-detail-page-client.tsx`     | generateMetadata (dynamic, fetches post)      |
| `(public)/explore/page.tsx`                                | `explore-page-client.tsx`         | static metadata                               |
| `(public)/item/[itemId]/page.tsx`                          | `item-detail-page-client.tsx`     | generateMetadata (dynamic, fetches item)      |
| `(public)/collection/page.tsx`                             | `collection-page-client.tsx`      | static metadata                               |
| `(public)/collection/[categorySlug]/page.tsx`              | `category-series-page-client.tsx` | generateMetadata (dynamic, category name)     |
| `(public)/collection/[categorySlug]/[seriesSlug]/page.tsx` | `series-items-page-client.tsx`    | generateMetadata (dynamic, series name)       |

**App (5 pages):**

| Page                                      | Client Wrapper                     | Metadata Type   |
| ----------------------------------------- | ---------------------------------- | --------------- |
| `(app)/saved/page.tsx`                    | `saved-page-client.tsx`            | static metadata |
| `(app)/complete-profile/page.tsx`         | `complete-profile-page-client.tsx` | static metadata |
| `(app)/checklists/page.tsx`               | `checklists-page-client.tsx`       | static metadata |
| `(app)/checklists/new/page.tsx`           | `new-checklist-page-client.tsx`    | static metadata |
| `(app)/checklists/[checklistId]/page.tsx` | `checklist-detail-page-client.tsx` | static metadata |

**Auth (3 pages):**

| Page                              | Client Wrapper                    | Metadata Type   | Special                              |
| --------------------------------- | --------------------------------- | --------------- | ------------------------------------ |
| `(auth)/verify-email/page.tsx`    | `verify-email-page-client.tsx`    | static metadata | Needs `<Suspense>` (useSearchParams) |
| `(auth)/forgot-password/page.tsx` | `forgot-password-page-client.tsx` | static metadata |                                      |
| `(auth)/reset-password/page.tsx`  | `reset-password-page-client.tsx`  | static metadata | Needs `<Suspense>` (useSearchParams) |

### Category 2: Stale Imports in features/ Components (6 files)

| File                                                       | Broken Import                         | Correct Import                                                         |
| ---------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------- |
| `features/auth/hooks/auth-queries.ts`                      | `@/stores/auth-store`                 | `@/features/auth/stores/auth-store` (relative: `../stores/auth-store`) |
| `features/post/components/post-card.tsx`                   | `@/stores/auth-store`                 | `@/features/auth` (barrel)                                             |
| `features/post/components/post-card.tsx`                   | `@/hooks/queries/interaction-queries` | `../hooks/interaction-queries` (relative within feature)               |
| `features/post/components/post-detail-modal.tsx`           | `@/hooks/queries/post-queries`        | `../hooks/post-queries` (relative within feature)                      |
| `features/post/components/post-detail-modal.tsx`           | `@/components/comment/comment-list`   | `@/features/comment` (barrel)                                          |
| `features/collection/components/owned-wishlist-toggle.tsx` | `@/stores/auth-store`                 | `@/features/auth` (barrel)                                             |
| `features/collection/components/owned-wishlist-toggle.tsx` | `@/hooks/queries/collection-queries`  | `../hooks/collection-queries` (relative within feature)                |
| `features/profile/components/profile-edit-modal.tsx`       | `@/hooks/queries/profile-queries`     | `../hooks/profile-queries` (relative within feature)                   |
| `features/social/components/follow-button.tsx`             | `@/stores/auth-store`                 | `@/features/auth` (barrel)                                             |
| `features/social/components/follow-button.tsx`             | `@/hooks/queries/social-queries`      | `../hooks/social-queries` (relative within feature)                    |

### Category 3: forwardRef in UI Components (19 files)

All 19 files in `frontend/src/components/ui/` need forwardRef removed:

`alert-dialog.tsx`, `avatar.tsx`, `button.tsx`, `card.tsx`, `carousel.tsx`, `checkbox.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `form.tsx`, `input.tsx`, `label.tsx`, `popover.tsx`, `progress.tsx`, `scroll-area.tsx`, `separator.tsx`, `switch.tsx`, `tabs.tsx`, `textarea.tsx`, `toast.tsx`

**Already clean (no forwardRef):** `badge.tsx`, `sheet.tsx`, `skeleton.tsx`, `sonner.tsx`, `toaster.tsx`

### Category 4: Type Errors in features/ (Non-Import)

| File                                                          | Error                                                                                              | Fix                                                                                    |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `features/auth/hooks/auth-queries.ts:47-53`                   | useSignupMutation expects `{email, password, name, username}` but SignupDto is `{email, password}` | Update mutationFn parameter type to match SignupDto                                    |
| `features/profile/components/complete-profile-form.tsx:69-70` | Type 'unknown' not assignable to 'string'                                                          | Add type annotation to mutateAsync data parameter                                      |
| Various hooks files                                           | TS7006 implicit 'any' type on callback params                                                      | Add type annotations (e.g., `(old: SomeType)`, `(item: ItemType)`, `(page: PageType)`) |

## Error Count Summary

| Error Type                  | Count  | Source                                                      |
| --------------------------- | ------ | ----------------------------------------------------------- |
| TS2307 (Cannot find module) | 53     | 17 page.tsx files + 6 features/ components with old imports |
| TS7006 (implicit any)       | 24     | Callback parameters in page.tsx and features/ hooks         |
| TS2345 (type mismatch)      | 1      | signup-form.tsx vs useSignupMutation                        |
| TS2322 (type assignment)    | 2      | complete-profile-form.tsx mutateAsync                       |
| **Total**                   | **86** | All from `pnpm --filter @figly/frontend exec tsc --noEmit`  |

**Note:** The TS7006 (implicit any) errors in page.tsx files will auto-resolve when the page.tsx files are replaced with Server Component versions (since the client wrappers already have correct types).

## Code Examples

### Server Component Page with Static Metadata

```typescript
// Source: Working reference from (app)/page.tsx and (auth)/login/page.tsx
import type { Metadata } from 'next';
import { SavedPageClient } from './saved-page-client';

export const metadata: Metadata = {
  title: 'Da luu | Figly',
  description: 'Xem cac bai viet da luu cua ban',
};

export default async function SavedPage() {
  return <SavedPageClient />;
}
```

### Server Component Page with Suspense (for useSearchParams)

```typescript
// Source: Phase 14-04 summary - verify-email and reset-password pattern
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { VerifyEmailPageClient } from './verify-email-page-client';

export const metadata: Metadata = {
  title: 'Xac minh email | Figly',
  description: 'Xac minh dia chi email cua ban',
};

export default async function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailPageClient />
    </Suspense>
  );
}
```

### Fixed useSignupMutation

```typescript
// Fix type to match current SignupDto (email + password only, per Phase 11)
export function useSignupMutation() {
  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await apiClient.post('/auth/signup', data);
      return response.data;
    },
  });
}
```

## Validation Architecture

### Test Framework

| Property           | Value                                              |
| ------------------ | -------------------------------------------------- |
| Framework          | TypeScript compiler (tsc --noEmit) + Next.js build |
| Config file        | `frontend/tsconfig.json`                           |
| Quick run command  | `pnpm --filter @figly/frontend exec tsc --noEmit`  |
| Full suite command | `pnpm --filter @figly/frontend build`              |

### Phase Requirements to Test Map

| Req ID  | Behavior                                         | Test Type   | Automated Command                                                                         | File Exists? |
| ------- | ------------------------------------------------ | ----------- | ----------------------------------------------------------------------------------------- | ------------ |
| FRMW-01 | Zero forwardRef in UI components                 | grep audit  | `grep -r "forwardRef" frontend/src/components/ui/ \| wc -l` (expect 0)                    | N/A          |
| FRMW-02 | async params, metadata exports                   | build check | `pnpm --filter @figly/frontend build`                                                     | N/A          |
| FRNT-01 | All imports resolve via features/                | typecheck   | `pnpm --filter @figly/frontend exec tsc --noEmit 2>&1 \| grep TS2307 \| wc -l` (expect 0) | N/A          |
| FRNT-03 | All page.tsx are Server Components with metadata | grep audit  | `grep -rl "use client" frontend/src/app/**/page.tsx \| wc -l` (expect 0)                  | N/A          |

### Sampling Rate

- **Per task commit:** `pnpm --filter @figly/frontend exec tsc --noEmit`
- **Per wave merge:** `pnpm --filter @figly/frontend build`
- **Phase gate:** Full build green + all grep audits pass

### Wave 0 Gaps

None -- existing TypeScript compiler and Next.js build provide all needed validation.

## Sources

### Primary (HIGH confidence)

- Direct codebase audit: `pnpm --filter @figly/frontend exec tsc --noEmit` (86 errors catalogued)
- Phase 14-03 and 14-04 summaries: Document exact Server Component patterns and client wrapper files
- Phase 12-02 summary: Documents exact forwardRef removal pattern for all 20 UI components
- Phase 11 summary: Documents signup simplification to email+password only
- Existing working pages: `(app)/page.tsx`, `(app)/reels/page.tsx`, `(auth)/login/page.tsx`, `(auth)/signup/page.tsx`
- Project skill: `.agents/skills/vercel-composition-patterns/rules/react19-no-forwardref.md`

### Secondary (MEDIUM confidence)

- Phase 15-01 merge as regression source (inferred from the pattern: page.tsx reverted but new \*-client.tsx files survived)

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - no new libraries, just restoring existing patterns
- Architecture: HIGH - 4 working reference pages + 19 surviving client wrappers prove the pattern
- Pitfalls: HIGH - all issues catalogued from actual tsc output, not hypothetical

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (stable patterns, no external dependency changes expected)
