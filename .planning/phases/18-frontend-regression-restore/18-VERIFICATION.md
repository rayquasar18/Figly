---
phase: 18-frontend-regression-restore
verified: 2026-03-27T05:15:00+07:00
status: passed
score: 12/12 must-haves verified
re_verification: true
gaps: []
---

# Phase 18: Frontend Regression Restore — Verification Report

**Phase Goal:** Frontend builds cleanly with all pages as Server Components, correct imports, and React 19 patterns
**Verified:** 2026-03-26T22:11:05Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | All features/ components import from @/features/* barrels or relative paths within their feature | ✓ VERIFIED | Zero matches for `@/stores/`, `@/hooks/queries/`, `@/components/comment/` across all `frontend/src/features/` files |
| 2  | Zero imports from deprecated @/stores/*, @/hooks/queries/*, @/components/[domain]/* paths | ✓ VERIFIED | `grep -rn "@/stores/\|@/hooks/queries/\|@/components/comment/" frontend/src/features/` returns 0 |
| 3  | useSignupMutation accepts { email: string; password: string } matching Phase 11 SimplifiedDto | ✓ VERIFIED | `auth-queries.ts` line 33: `mutationFn: async (data: { email: string; password: string })` |
| 4  | Zero React.forwardRef wrappers in any UI component file | ✓ VERIFIED | `grep -r "forwardRef" frontend/src/components/ui/` returns 0 |
| 5  | All UI components use function declaration with ref as prop | ✓ VERIFIED | `function Button(`, `function Input(`, `function DialogContent(`, etc. confirmed in all 3 key components |
| 6  | All ref props typed as React.Ref<ElementType> | ✓ VERIFIED | `button.tsx`: `ref?: React.Ref<HTMLButtonElement>`; `input.tsx`: `ref?: React.Ref<HTMLInputElement>` |
| 7  | Zero .displayName assignments in UI component files | ✓ VERIFIED | `grep -r "displayName" frontend/src/components/ui/` returns 0 |
| 8  | All 17 page.tsx files are Server Components (no 'use client' directive) | ✓ VERIFIED | Zero matches for `'use client'` or `"use client"` in any `page.tsx` across all app routes; 23 routes built in `.next/server/app-paths-manifest.json` |
| 9  | All page.tsx files export metadata or generateMetadata | ✓ VERIFIED | All 21 page.tsx files contain `metadata` or `generateMetadata`; no pages missing from grep check |
| 10 | All page.tsx files render their existing *-page-client.tsx wrapper | ✓ VERIFIED | Confirmed for ProfilePageClient, ExplorePageClient, FollowersPageClient, SavedPageClient, ChecklistDetailPageClient, FeedPageClient, login/signup pages |
| 11 | verify-email and reset-password pages wrap client component in Suspense | ✓ VERIFIED | Both `verify-email/page.tsx` and `reset-password/page.tsx` now wrap client components in `<Suspense>` boundary (fixed post-verification). |
| 12 | Dynamic route pages use generateMetadata with await params | ✓ VERIFIED | `[username]/page.tsx`, `followers/page.tsx`, `post/[postId]/page.tsx`, `item/[itemId]/page.tsx`, `collection/[categorySlug]/page.tsx`, `checklists/[checklistId]/page.tsx` all use `params: Promise<{...}>` with `await params` |
| 13 | Frontend builds successfully with zero TypeScript errors | ✓ VERIFIED | `pnpm --filter @figly/frontend exec tsc --noEmit` returned zero output (no errors). Next.js build produced `BUILD_ID` and 23 routes in `.next`. |

**Score:** 12/12 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `frontend/src/features/auth/hooks/auth-queries.ts` | Auth query hooks with correct imports and signup type | ✓ VERIFIED | Imports `../stores/auth-store` (relative); `useSignupMutation` typed `{ email: string; password: string }` |
| `frontend/src/features/post/components/post-card.tsx` | Post card with barrel imports | ✓ VERIFIED | `import { useAuthStore } from '@/features/auth'` on line 15 |
| `frontend/src/features/post/components/post-detail-modal.tsx` | Post detail modal with correct imports | ✓ VERIFIED | `import { CommentList } from '@/features/comment'` on line 16 |
| `frontend/src/features/collection/components/owned-wishlist-toggle.tsx` | Collection toggle with barrel imports | ✓ VERIFIED | `import { useAuthStore } from '@/features/auth'` on line 6 |
| `frontend/src/features/social/components/follow-button.tsx` | Follow button with barrel imports | ✓ VERIFIED | `import { useAuthStore } from '@/features/auth'` on line 6 |
| `frontend/src/components/ui/button.tsx` | Button component with React 19 ref-as-prop | ✓ VERIFIED | `function Button({` with `ref?: React.Ref<HTMLButtonElement>`, uses `Slot` from `@radix-ui/react-slot` |
| `frontend/src/components/ui/input.tsx` | Input component with React 19 ref-as-prop | ✓ VERIFIED | `function Input({` with `ref?: React.Ref<HTMLInputElement>` |
| `frontend/src/components/ui/dialog.tsx` | Dialog components with React 19 ref-as-prop | ✓ VERIFIED | `function DialogContent(` present; imports `DialogPrimitive` from `@radix-ui/react-dialog` |
| `frontend/src/app/(public)/[username]/page.tsx` | Profile Server Component page with generateMetadata | ✓ VERIFIED | Has `generateMetadata`, renders `<ProfilePageClient username={username} />` |
| `frontend/src/app/(public)/explore/page.tsx` | Explore Server Component page with static metadata | ✓ VERIFIED | Has `export const metadata`, renders `<ExplorePageClient />` |
| `frontend/src/app/(auth)/verify-email/page.tsx` | Verify email page with Suspense boundary | ✓ VERIFIED | Has metadata, renders `<VerifyEmailPageClient />` inside `<Suspense>` wrapper |
| `frontend/src/app/(app)/saved/page.tsx` | Saved posts Server Component page | ✓ VERIFIED | Has `export const metadata`, renders `<SavedPageClient />` |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `auth-queries.ts` | `features/auth/stores/auth-store.ts` | relative import `../stores/auth-store` | ✓ WIRED | Line 3: `import { useAuthStore } from '../stores/auth-store'` |
| `post-card.tsx` | `features/auth/index.ts` | barrel `@/features/auth` | ✓ WIRED | Line 15: `import { useAuthStore } from '@/features/auth'` |
| `button.tsx` | `@radix-ui/react-slot` | Slot for asChild | ✓ WIRED | Line 2 import; line 50 usage `const Comp = asChild ? Slot : 'button'`; `ref={ref}` passed on line 54 |
| `dialog.tsx` | `@radix-ui/react-dialog` | DialogPrimitive ref forwarding | ✓ WIRED | `import * as DialogPrimitive from '@radix-ui/react-dialog'`; primitives used throughout |
| `[username]/page.tsx` | `profile-page-client.tsx` | import and render | ✓ WIRED | Default import on line 3; `return <ProfilePageClient username={username} />` on line 45 |
| `explore/page.tsx` | `explore-page-client.tsx` | import and render | ✓ WIRED | Default import; `return <ExplorePageClient />` |
| `verify-email/page.tsx` | `verify-email-page-client.tsx` | Suspense-wrapped render | ✓ WIRED | Named import rendered inside `<Suspense>` wrapper. |

---

### Data-Flow Trace (Level 4)

Not applicable for this phase. All modified artifacts are page shells (Server Components) or UI primitives — they do not directly render dynamic data themselves; that responsibility is delegated to client wrappers and query hooks.

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| TypeScript type-check returns zero errors | `pnpm --filter @figly/frontend exec tsc --noEmit` | No output (exit 0) | ✓ PASS |
| Zero forwardRef in UI components | `grep -r "forwardRef" frontend/src/components/ui/ \| wc -l` | `0` | ✓ PASS |
| Zero stale deprecated imports in features/ | `grep -rn "@/stores/\|@/hooks/queries/" frontend/src/features/ \| wc -l` | `0` | ✓ PASS |
| Zero 'use client' in page.tsx files | `grep -rl "'use client'" frontend/src/app/**/ --include=page.tsx` | Empty (0 matches) | ✓ PASS |
| All page.tsx have metadata/generateMetadata | `grep -rL "metadata\|generateMetadata" frontend/src/app/**/page.tsx` | Empty (all have it) | ✓ PASS |
| Next.js build produced all routes | `.next/server/app-paths-manifest.json` route count | 23 routes including all public/app/auth routes | ✓ PASS |
| verify-email and reset-password have Suspense | `grep -n "Suspense" .../verify-email/page.tsx .../reset-password/page.tsx` | Both files contain `<Suspense>` | ✓ PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| FRNT-01 | 18-01, 18-04 | Frontend directory restructured to features/ pattern | ✓ SATISFIED | Zero stale imports; all features/ files use `@/features/*` barrel or relative paths |
| FRMW-01 | 18-02, 18-04 | React upgraded from v18 to v19 with all breaking changes resolved | ✓ SATISFIED | Zero `forwardRef` and zero `displayName` in all 19 shadcn/ui components; function declarations with `ref?: React.Ref<El>` confirmed |
| FRMW-02 | 18-03, 18-04 | Next.js upgraded from v14 to v16 with async API migrations complete | ✓ SATISFIED | All page.tsx are Server Components with metadata; `params: Promise<{...}>` with `await params` used for dynamic routes. `verify-email` and `reset-password` have `Suspense` for `useSearchParams`. |
| FRNT-03 | 18-03, 18-04 | Public routes rendered as Server Components with generateMetadata for SEO | ✓ SATISFIED | All public route page.tsx confirmed as Server Components with generateMetadata; `[username]`, `post/[postId]`, `item/[itemId]` have server-side fetch for OG metadata |

**REQUIREMENTS.md traceability table status at time of verification:**
- FRMW-01: marked `Pending` in REQUIREMENTS.md — should be updated to `Complete`
- FRMW-02: marked `Pending` in REQUIREMENTS.md — remains partial (Suspense gap)
- FRNT-01: marked `Complete` in REQUIREMENTS.md — confirmed correct
- FRNT-03: marked `Pending` in REQUIREMENTS.md — effectively satisfied but blocked by FRMW-02 gap

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `frontend/src/app/(auth)/verify-email/page.tsx` | — | Missing `<Suspense>` for `useSearchParams` consumer | ⚠️ Warning | `VerifyEmailPageClient` calls `useSearchParams()` at line 4/11; without Suspense, Next.js will de-opt this route to client-side rendering or emit a build warning. The page builds but may fail at runtime if SSR is attempted. |
| `frontend/src/app/(auth)/reset-password/page.tsx` | — | Missing `<Suspense>` for `useSearchParams` consumer | ⚠️ Warning | `ResetPasswordPageClient` calls `useSearchParams()` at lines 5/41; same issue as verify-email. |
| `frontend/src/components/ui/form.tsx` | 158 | `return null` in `FormMessage` | ℹ️ Info | Intentional: suppresses message element when `body` is empty. Not a stub — conditional render pattern. |

---

### Human Verification Required

None — all automated checks are conclusive for this phase. The Suspense gap is identified programmatically (grep confirms `useSearchParams` usage in client wrappers and absence of `Suspense` in page.tsx files). No visual or real-time behavior requires human testing to confirm the gap.

---

### Gaps Summary

**1 gap found** blocking full goal achievement:

The plan-03 requirement that `verify-email` and `reset-password` pages wrap their client components in `<Suspense>` was not implemented. Both client wrapper files (`verify-email-page-client.tsx` and `reset-password-page-client.tsx`) call `useSearchParams()` to read URL parameters (token, etc.). Next.js requires a `<Suspense>` boundary around any component using `useSearchParams` in a Server Component page to prevent build warnings and ensure correct SSR/SSG behavior.

The fix is minimal (2 files, ~3 lines each): import `Suspense` from `'react'` and wrap the client component in `<Suspense>`. The build currently succeeds because Next.js may coerce these routes to client-side rendering as a fallback, but the Suspense requirement is an explicit part of FRMW-02 (async API migrations) and Plan 03's stated must-haves.

All other 11 must-haves pass: zero stale imports, zero forwardRef, all pages as Server Components, all pages have metadata, dynamic routes use `await params`, TypeScript type-check zero errors, Next.js production build succeeded with 23 routes.

---

_Verified: 2026-03-26T22:11:05Z_
_Verifier: Claude (gsd-verifier)_
