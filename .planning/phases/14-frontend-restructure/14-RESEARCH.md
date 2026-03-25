# Phase 14: Frontend Restructure - Research

**Researched:** 2026-03-25
**Domain:** Next.js App Router (Server Components, Proxy/Middleware, SEO metadata, dark mode)
**Confidence:** HIGH

## Summary

Phase 14 restructures the Figly frontend across four independent workstreams: (1) reorganize `components/`, `hooks/queries/`, and `stores/` into a domain-grouped `features/` directory with barrel exports, (2) add server-side auth redirection via Next.js 16 `proxy.ts` (the successor to `middleware.ts`), (3) convert all 21 page files from `'use client'` to async Server Components with `generateMetadata()` for SEO, and (4) configure `next-themes` for dark mode with light/dark/system toggle.

The project is on Next.js 16.2.1 (App Router), React 19.2, and already has `next-themes@0.4.6` installed, Tailwind configured with `darkMode: ['class']`, and shadcn/ui CSS variables with a `.dark` theme defined in `globals.css`. The backend uses httpOnly cookies named `access_token` and `refresh_token` with JWT payloads containing `sub` (userId) and `exp` claims.

**Primary recommendation:** Use Next.js 16's `proxy.ts` file convention (not deprecated `middleware.ts`) for auth redirects, create a server-side `fetchApi()` utility that forwards cookies from the request context for authenticated Server Component data fetching, and structure the features/ directory with barrel files for clean imports.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Create `features/` directory with full domain isolation -- each feature folder contains its own components/, hooks/, stores/, and types/
- **D-02:** Feature folders: `features/auth/`, `features/post/`, `features/feed/`, `features/reel/`, `features/profile/`, `features/social/`, `features/collection/`, `features/checklist/`, `features/comment/`, `features/create-post/`
- **D-03:** Keep `components/ui/` at current location -- shadcn/ui primitives are shared, not domain-specific
- **D-04:** Keep `components/layout/` at current location -- sidebar, bottom-nav, header-search, public-nav are shared layout components
- **D-05:** Keep `lib/` at current location -- api-client, query-client, utils are shared utilities
- **D-06:** Each feature folder has an `index.ts` barrel file re-exporting public API
- **D-07:** Move domain-specific hooks from `hooks/queries/` into their feature folder
- **D-08:** Move domain-specific stores from `stores/` into their feature folder
- **D-09:** Enterprise-standard auth middleware flow: check cookie existence -> decode JWT to verify expiry -> check refreshToken if expired -> redirect to /login if no valid tokens
- **D-10:** Route protection strategy: blacklist -- explicitly list protected routes (/, /reels, /saved, /checklists, /complete-profile)
- **D-11:** Keep client-side auth checks in layout.tsx as defense-in-depth fallback
- **D-12:** Middleware does NOT call backend API -- purely cookie + JWT decode for speed
- **D-13:** All pages converted to Server Components at page level
- **D-14:** Pattern: page.tsx (Server Component, fetches initial data) -> passes props to *-client.tsx ('use client' for interactivity)
- **D-15:** Server Components call backend API directly (fetch) for initial data. Client components continue using React Query for mutations and real-time updates
- **D-16:** generateMetadata() on all public pages with full Open Graph + Twitter Card meta tags
- **D-17:** Profile pages: og:image = user avatar. Post pages: og:image = first image. Collection pages: og:image = item/series image
- **D-18:** Authenticated pages also become Server Components -- server fetch initial data, hydrate client components with React Query
- **D-19:** Use next-themes library for ThemeProvider (already in dependencies)
- **D-20:** Three options: Light / Dark / System. Default follows system preference
- **D-21:** Toggle placed in user avatar dropdown menu
- **D-22:** Persist choice in localStorage across sessions (next-themes handles automatically)
- **D-23:** Tailwind already configured with darkMode: ['class'] -- shadcn/ui CSS variables will work with dark theme values

### Claude's Discretion
- Exact feature folder internal structure (components/, hooks/, stores/ subdirs vs flat)
- Server-side fetch utility/helper design for calling backend from Server Components
- Dark theme CSS variable values for shadcn/ui (appropriate dark palette)
- Loading/skeleton patterns for Server Component -> Client Component hydration
- Exact middleware matcher pattern syntax
- How to handle auth-store.ts (Zustand) -- may need to remain global since it's used across features

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FRNT-01 | Frontend directory restructured to features/ pattern (domain-grouped components, hooks, stores) | Architecture Patterns section: feature folder structure, barrel exports, file mapping from current to target locations |
| FRNT-02 | Next.js middleware handles auth redirects (no client-side flash of content) | Architecture Patterns: proxy.ts (Next.js 16 renamed middleware), cookie-based JWT decode, blacklist matcher pattern |
| FRNT-03 | Public routes rendered as Server Components with generateMetadata for SEO | Architecture Patterns: Server Component page pattern, generateMetadata with async fetch, Open Graph field mapping |
| FRNT-04 | ThemeProvider configured with dark mode support (system preference + manual toggle) | Standard Stack: next-themes@0.4.6 setup, ThemeProvider in providers.tsx, useTheme hook for toggle UI |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.2.1 | Framework -- App Router, Server Components, proxy | Already installed, current latest |
| react | 19.2.0 | UI library -- Server Components, `use()` hook | Already installed |
| next-themes | 0.4.6 | Dark mode -- ThemeProvider, useTheme, localStorage persistence | Already installed in package.json |
| @tanstack/react-query | 5.62.0 | Client-side data fetching -- mutations, refetching, cache | Already installed, continues for client components |
| zustand | 5.0.0 | Client state -- auth-store, create-post-store, create-reel-store | Already installed |

### Supporting (no new installs needed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| jose | (built-in to Next.js) | JWT decode in proxy.ts -- Edge Runtime compatible | Proxy runs in Edge Runtime by default; jose ships with Next.js internals |
| tailwindcss | 3.4.x | CSS utility framework with darkMode: ['class'] | Already configured |
| sonner | 2.0.7 | Toast notifications via Toaster | Already installed, remains in providers |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| jose for JWT decode | jsonwebtoken | jsonwebtoken uses Node.js crypto -- incompatible with Edge Runtime where proxy runs by default |
| next-themes | Custom context + localStorage | next-themes handles FOUC prevention, system preference detection, SSR-safe hydration -- no reason to hand-roll |
| Server-side fetch utility | tRPC or server actions | Overkill for this project; direct fetch with cookie forwarding is simpler and maps to existing REST API |

**Installation:**
```bash
# jose may need explicit install if not re-exported from next/server
cd frontend && pnpm add jose
```

**Version verification:** All core packages already installed at current versions. `jose` is the only potential new dependency -- verify with `pnpm add jose` (latest is 6.x, Edge-compatible).

## Architecture Patterns

### Recommended Project Structure (Target State)
```
frontend/src/
├── app/                           # Next.js App Router pages (unchanged structure)
│   ├── layout.tsx                 # Root layout with ThemeProvider
│   ├── providers.tsx              # QueryClientProvider + ThemeProvider + Toaster
│   ├── globals.css                # CSS variables (light + dark themes)
│   ├── (app)/                     # Authenticated route group
│   │   ├── layout.tsx             # Client-side auth fallback (defense-in-depth)
│   │   ├── page.tsx               # Server Component -> FeedPageClient
│   │   ├── reels/page.tsx         # Server Component -> ReelsPageClient
│   │   ├── saved/page.tsx         # Server Component -> SavedPageClient
│   │   └── checklists/...         # Server Component pages
│   ├── (auth)/                    # Auth pages (login, signup, etc.)
│   └── (public)/                  # Public pages with generateMetadata
│       ├── [username]/page.tsx    # generateMetadata + ProfilePageClient
│       ├── post/[postId]/page.tsx # generateMetadata + PostDetailClient
│       └── ...
├── features/                      # Domain-grouped feature modules (NEW)
│   ├── auth/
│   │   ├── index.ts               # Barrel: re-exports public API
│   │   ├── components/
│   │   │   ├── login-form.tsx
│   │   │   ├── signup-form.tsx
│   │   │   └── social-login-buttons.tsx
│   │   ├── hooks/
│   │   │   └── auth-queries.ts
│   │   └── stores/
│   │       └── auth-store.ts      # Stays here but also re-exported globally
│   ├── post/
│   │   ├── index.ts
│   │   ├── components/
│   │   │   ├── post-card.tsx
│   │   │   ├── post-carousel.tsx
│   │   │   ├── post-actions.tsx
│   │   │   ├── post-detail-modal.tsx
│   │   │   ├── post-menu.tsx
│   │   │   └── caption-display.tsx
│   │   └── hooks/
│   │       └── post-queries.ts
│   ├── feed/
│   │   ├── index.ts
│   │   ├── components/
│   │   │   ├── feed-list.tsx
│   │   │   ├── feed-skeleton.tsx
│   │   │   └── empty-feed.tsx
│   │   └── hooks/
│   │       └── (uses post-queries -- no separate file)
│   ├── reel/
│   │   ├── index.ts
│   │   ├── components/
│   │   │   ├── reel-feed.tsx
│   │   │   ├── reel-card.tsx
│   │   │   ├── reel-actions.tsx
│   │   │   ├── reel-author-info.tsx
│   │   │   ├── reel-comments-sheet.tsx
│   │   │   ├── reel-skeleton.tsx
│   │   │   ├── profile-reel-grid.tsx
│   │   │   └── create-reel-flow.tsx
│   │   ├── hooks/
│   │   │   └── reel-queries.ts
│   │   └── stores/
│   │       └── create-reel-store.ts
│   ├── profile/
│   │   ├── index.ts
│   │   ├── components/
│   │   │   ├── profile-header.tsx
│   │   │   ├── profile-post-grid.tsx
│   │   │   ├── profile-skeleton.tsx
│   │   │   ├── profile-edit-modal.tsx
│   │   │   ├── profile-stats.tsx
│   │   │   └── complete-profile-form.tsx
│   │   └── hooks/
│   │       └── profile-queries.ts
│   ├── social/
│   │   ├── index.ts
│   │   ├── components/
│   │   │   ├── follow-button.tsx
│   │   │   ├── follower-list.tsx
│   │   │   └── user-row.tsx
│   │   └── hooks/
│   │       └── social-queries.ts
│   ├── collection/
│   │   ├── index.ts
│   │   ├── components/
│   │   │   ├── category-card.tsx
│   │   │   ├── series-card.tsx
│   │   │   ├── item-card.tsx
│   │   │   ├── item-detail.tsx
│   │   │   ├── item-picker.tsx
│   │   │   ├── item-search.tsx
│   │   │   ├── collection-showcase.tsx
│   │   │   ├── follow-series-button.tsx
│   │   │   └── owned-wishlist-toggle.tsx
│   │   └── hooks/
│   │       └── collection-queries.ts
│   ├── checklist/
│   │   ├── index.ts
│   │   ├── components/
│   │   │   ├── checklist-card.tsx
│   │   │   ├── checklist-entry.tsx
│   │   │   └── checklist-form.tsx
│   │   └── hooks/
│   │       └── checklist-queries.ts
│   ├── comment/
│   │   ├── index.ts
│   │   ├── components/
│   │   │   ├── comment-list.tsx
│   │   │   ├── comment-item.tsx
│   │   │   └── comment-input.tsx
│   │   └── hooks/
│   │       └── comment-queries.ts
│   └── create-post/
│       ├── index.ts
│       ├── components/
│       │   ├── create-post-flow.tsx
│       │   ├── image-cropper.tsx
│       │   ├── step-caption.tsx
│       │   ├── step-edit.tsx
│       │   └── step-gallery.tsx
│       └── stores/
│           └── create-post-store.ts
├── components/
│   ├── ui/                        # shadcn/ui primitives (UNCHANGED)
│   └── layout/                    # Shared layout components (UNCHANGED)
│       ├── sidebar.tsx
│       ├── bottom-nav.tsx
│       ├── header-search.tsx
│       └── public-nav.tsx
├── hooks/
│   ├── use-auth.ts                # Keep -- general auth init hook
│   └── use-toast.ts               # Keep -- general toast hook
│   └── queries/                   # REMOVE (emptied -- all moved to features/)
├── stores/                        # REMOVE (emptied -- all moved to features/)
├── lib/
│   ├── api-client.ts              # UNCHANGED -- Axios for client components
│   ├── server-fetch.ts            # NEW -- Server-side fetch utility
│   ├── query-client.ts            # UNCHANGED
│   ├── utils.ts                   # UNCHANGED
│   └── crop-image.ts              # UNCHANGED
└── proxy.ts                       # NEW -- Auth redirect proxy (was middleware.ts)
```

### Pattern 1: Next.js 16 Proxy for Auth Redirects (proxy.ts, not middleware.ts)

**CRITICAL DISCOVERY:** Next.js 16 has **renamed** `middleware.ts` to `proxy.ts`. The `middleware.ts` convention is deprecated and triggers a build warning: "The middleware file convention is deprecated. Please use proxy instead." The file must be named `proxy.ts` and the exported function must be named `proxy` (not `middleware`).

**What:** Server-side request interceptor that checks auth cookies before rendering protected pages
**When to use:** Every request to protected routes
**File location:** `frontend/src/proxy.ts` (same level as `app/`)

```typescript
// Source: Next.js 16 official docs (proxy.ts convention)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const PROTECTED_ROUTES = ['/', '/reels', '/saved', '/checklists', '/complete-profile'];

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only check protected routes
  if (!isProtectedRoute(pathname)) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  // No tokens at all -> redirect to login
  if (!accessToken && !refreshToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If access token exists, verify it hasn't expired
  if (accessToken) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      await jwtVerify(accessToken, secret);
      return NextResponse.next(); // Valid access token
    } catch {
      // Access token expired or invalid -- fall through to refresh check
    }
  }

  // If refresh token exists, allow through (client-side interceptor will refresh)
  if (refreshToken) {
    return NextResponse.next();
  }

  // No valid tokens
  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: [
    // Match all routes except API, static files, and metadata files
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
```

**Key design decisions:**
- Blacklist approach: only explicitly listed protected routes get checked
- NO backend API calls from proxy (D-12) -- purely cookie + JWT decode
- If refresh token exists but access token expired, allow through -- client-side interceptor in `api-client.ts` handles the refresh
- `jose` library for JWT verification -- Edge Runtime compatible (jsonwebtoken is not)
- JWT_SECRET must be available to the frontend process via `NEXT_PUBLIC_` or server-only env var

### Pattern 2: Server Component Page with Client Hydration

**What:** Each page.tsx is an async Server Component that fetches initial data and passes it to a `'use client'` component
**When to use:** Every page in the app (both public and authenticated)

```typescript
// Source: Next.js 16 official docs -- Server Component data fetching pattern
// frontend/src/app/(public)/[username]/page.tsx

import type { Metadata } from 'next';
import { fetchApi } from '@/lib/server-fetch';
import type { ProfileResponse } from '@figly/shared';
import { ProfilePageClient } from '@/features/profile';

// Server-side data fetching for SEO metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const profile = await fetchApi<ProfileResponse>(`/profiles/${username}`);

  if (!profile) {
    return { title: 'Nguoi dung khong ton tai | Figly' };
  }

  return {
    title: `${profile.displayName} (@${profile.username}) | Figly`,
    description: profile.bio || `Xem bo suu tap cua ${profile.displayName} tren Figly`,
    openGraph: {
      title: `${profile.displayName} (@${profile.username})`,
      description: profile.bio || `Xem bo suu tap cua ${profile.displayName} tren Figly`,
      images: profile.avatarUrl ? [{ url: profile.avatarUrl }] : [],
      type: 'profile',
      url: `/${profile.username}`,
    },
    twitter: {
      card: 'summary',
      title: `${profile.displayName} (@${profile.username})`,
      description: profile.bio || `Xem bo suu tap cua ${profile.displayName} tren Figly`,
      images: profile.avatarUrl ? [profile.avatarUrl] : [],
    },
  };
}

// Server Component -- fetches initial data, passes to client
export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await fetchApi<ProfileResponse>(`/profiles/${username}`);

  return <ProfilePageClient username={username} initialProfile={profile} />;
}
```

### Pattern 3: Server-Side Fetch Utility

**What:** A thin wrapper around `fetch()` that forwards cookies from the incoming request to the backend API
**When to use:** All Server Component data fetching

```typescript
// frontend/src/lib/server-fetch.ts
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function fetchApi<T>(
  path: string,
  options?: RequestInit,
): Promise<T | null> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(accessToken ? { Cookie: `access_token=${accessToken}` } : {}),
      ...options?.headers,
    };

    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      cache: 'no-store', // Always fresh data for dynamic pages
    });

    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}
```

**Key considerations:**
- `cookies()` is async in Next.js 16 (must be awaited)
- Returns `null` on error rather than throwing -- pages handle gracefully
- `cache: 'no-store'` ensures fresh data on every request (no stale SSR)
- Cookie forwarding enables authenticated Server Component fetches

### Pattern 4: next-themes ThemeProvider Setup

**What:** Dark mode with three options (light/dark/system), no flash of unstyled content
**When to use:** Root providers wrapper

```typescript
// frontend/src/app/providers.tsx
'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { queryClient } from '@/lib/query-client';
import { Toaster } from '@/components/ui/sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
```

```typescript
// frontend/src/app/layout.tsx -- MUST add suppressHydrationWarning to <html>
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Figly',
  description: 'Share, showcase, and manage your collections',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### Pattern 5: Barrel File Pattern for Features

**What:** Each feature exports its public API through an `index.ts` barrel file
**When to use:** All feature directories

```typescript
// frontend/src/features/post/index.ts
// Components
export { PostCard } from './components/post-card';
export { PostCarousel } from './components/post-carousel';
export { PostActions } from './components/post-actions';
export { PostDetailModal } from './components/post-detail-modal';
export { PostMenu } from './components/post-menu';
export { CaptionDisplay } from './components/caption-display';

// Hooks
export { usePostDetail, useFeed, useUserPosts, useCreatePost, usePublicFeed, useSavedPosts } from './hooks/post-queries';
```

**IMPORTANT -- Tailwind content paths:** The `tailwind.config.ts` content array must be updated to include `features/`:
```typescript
content: [
  './src/components/**/*.{ts,tsx}',
  './src/features/**/*.{ts,tsx}',  // ADD THIS
  './src/app/**/*.{ts,tsx}',
],
```

### Pattern 6: React Query Hydration for Server -> Client Data

**What:** Pass server-fetched initial data to client components, pre-populate React Query cache
**When to use:** Authenticated pages that need both SSR initial data AND client-side refetching

```typescript
// Client component receives initial data from Server Component
'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ProfileResponse } from '@figly/shared';

export function ProfilePageClient({
  username,
  initialProfile,
}: {
  username: string;
  initialProfile: ProfileResponse | null;
}) {
  const { data: profile } = useQuery({
    queryKey: ['profile', username],
    queryFn: async () => {
      const res = await apiClient.get<ProfileResponse>(`/profiles/${username}`);
      return res.data;
    },
    initialData: initialProfile ?? undefined,
    staleTime: 5 * 60 * 1000,
  });

  // ... render with profile data (available instantly from SSR)
}
```

### Anti-Patterns to Avoid

- **Using `middleware.ts` instead of `proxy.ts`:** Next.js 16 deprecated `middleware.ts`. Using it triggers a build warning. Always use `proxy.ts` with `export function proxy()`.
- **Calling backend API from proxy:** Proxy runs on every matched request and should be fast. JWT decode is local-only; API calls add latency and failure modes.
- **`'use client'` on page.tsx files:** The whole point of this phase is removing `'use client'` from page files. Only extracted `*-client.tsx` components should have the directive.
- **Forgetting `suppressHydrationWarning` on `<html>`:** next-themes injects a `class` attribute on `<html>` before hydration. Without this attribute, React will throw a hydration mismatch warning.
- **Importing from feature internals:** Always import from the barrel file (`@/features/post`) never from internal paths (`@/features/post/components/post-card`).
- **Barrel files in tailwind content path:** The `tailwind.config.ts` `content` array must include `./src/features/**/*.{ts,tsx}` or Tailwind classes in feature components will be purged.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dark mode | Custom context + localStorage + script injection | next-themes ThemeProvider | Handles FOUC prevention, system pref detection, SSR-safe hydration, localStorage persistence |
| JWT decode in proxy | Custom base64 decoding | jose `jwtVerify()` | Edge Runtime compatible, handles all JWT edge cases (exp, nbf, iss validation) |
| Cookie forwarding in SSR | Manual header extraction | `cookies()` from `next/headers` | Next.js built-in, async in v16, handles all cookie formats |
| Metadata generation | Manual `<head>` injection | `generateMetadata()` + `Metadata` type | Next.js built-in, type-safe, auto-deduplicates, handles streaming |
| Auth redirect | Custom redirect in layout useEffect only | proxy.ts (primary) + layout useEffect (fallback) | Server-side redirect prevents content flash; layout is defense-in-depth |

**Key insight:** Every "hand-roll" temptation in this phase has a standard Next.js 16 or ecosystem solution. The page conversion to Server Components is the only work that requires manual effort -- and even that follows a strict mechanical pattern (remove 'use client', make async, extract interactive parts).

## Common Pitfalls

### Pitfall 1: FOUC (Flash of Unstyled Content) with Dark Mode
**What goes wrong:** Page briefly renders in light mode before dark mode kicks in
**Why it happens:** next-themes must inject a `<script>` before hydration to set the `class` attribute on `<html>`. If `suppressHydrationWarning` is missing or ThemeProvider is misconfigured, React fights this.
**How to avoid:** Always add `suppressHydrationWarning` to `<html>` tag. Place ThemeProvider as outermost provider (before QueryClientProvider). Use `attribute="class"` to match Tailwind's `darkMode: ['class']` config.
**Warning signs:** Brief white flash on page load when in dark mode.

### Pitfall 2: Cookies Not Available in Server Components
**What goes wrong:** `fetchApi()` returns null for authenticated endpoints
**Why it happens:** `cookies()` in Next.js 16 is async and must be awaited. If called synchronously or outside a request context, it fails silently.
**How to avoid:** Always `await cookies()` in server-fetch utility. Ensure backend allows cookie-based auth on GET endpoints (check CORS `credentials: true` and cookie domain/path).
**Warning signs:** Profile pages rendering "not found" for logged-in users.

### Pitfall 3: Proxy JWT_SECRET Must Be Available Server-Side
**What goes wrong:** Proxy cannot verify JWT, all users redirected to login
**Why it happens:** `NEXT_PUBLIC_` vars are embedded at build time; proxy may need a server-only env var. If using `jose.jwtVerify()`, the secret must be available at runtime.
**How to avoid:** Set `JWT_SECRET` in the frontend process environment (not `NEXT_PUBLIC_`). In Docker, pass it as a runtime env var. In proxy.ts, read from `process.env.JWT_SECRET`.
**Warning signs:** All protected routes redirect to /login even with valid cookies.

### Pitfall 4: Tailwind Classes Purged from Feature Components
**What goes wrong:** Components in `features/` directory have missing styles
**Why it happens:** `tailwind.config.ts` `content` array only scans `components/` and `app/`. New `features/` directory is not included.
**How to avoid:** Add `'./src/features/**/*.{ts,tsx}'` to the content array in tailwind.config.ts.
**Warning signs:** Components render with no styling after move to features/ directory.

### Pitfall 5: Circular Imports Between Features
**What goes wrong:** Build fails or runtime errors from circular dependencies
**Why it happens:** Feature A imports from Feature B's barrel, which imports from Feature A's barrel.
**How to avoid:** Features should depend on shared code (`lib/`, `components/ui/`) but not on each other's barrel files. If two features need to share a component, consider if it belongs in `components/layout/` or `components/ui/` instead.
**Warning signs:** TypeScript errors about circular references, infinite loops during import resolution.

### Pitfall 6: interaction-queries.ts Belongs Across Multiple Features
**What goes wrong:** Unclear where to place `interaction-queries.ts` which handles likes, bookmarks, follows
**Why it happens:** These interactions span post, social, and collection domains.
**How to avoid:** Split `interaction-queries.ts` by domain: like/bookmark mutations go to `features/post/hooks/`, follow mutations go to `features/social/hooks/`.
**Warning signs:** One huge hook file that every feature depends on.

### Pitfall 7: auth-store.ts Used Across Features
**What goes wrong:** Moving auth-store into features/auth/ breaks imports from features that depend on it
**Why it happens:** `useAuthStore` is used in auth-queries, profile-queries, sidebar, and other cross-cutting components.
**How to avoid:** Place `auth-store.ts` in `features/auth/stores/` but re-export it from the barrel file. All other features import from `@/features/auth`. The auth feature is a legitimate shared dependency.
**Warning signs:** Circular imports if auth feature imports from other features.

## Code Examples

### Complete generateMetadata for Post Detail Page

```typescript
// Source: Next.js 16 generateMetadata API + project data shapes
// frontend/src/app/(public)/post/[postId]/page.tsx

import type { Metadata } from 'next';
import { fetchApi } from '@/lib/server-fetch';
import type { PostResponse } from '@figly/shared';
import { PostDetailClient } from '@/features/post';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ postId: string }>;
}): Promise<Metadata> {
  const { postId } = await params;
  const post = await fetchApi<PostResponse>(`/posts/${postId}`);

  if (!post) {
    return { title: 'Bai viet khong ton tai | Figly' };
  }

  const authorName = post.author.displayName || post.author.username || 'Figly';
  const description = post.caption
    ? post.caption.slice(0, 160)
    : `Bai viet cua ${authorName} tren Figly`;
  const ogImage = post.media[0]?.url;

  return {
    title: `${authorName} tren Figly`,
    description,
    openGraph: {
      title: `${authorName} tren Figly`,
      description,
      images: ogImage ? [{ url: ogImage }] : [],
      type: 'article',
      url: `/post/${postId}`,
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title: `${authorName} tren Figly`,
      description,
      images: ogImage ? [ogImage] : [],
    },
  };
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  const post = await fetchApi<PostResponse>(`/posts/${postId}`);

  return <PostDetailClient postId={postId} initialPost={post} />;
}
```

### Theme Toggle Component for User Dropdown

```typescript
// Source: next-themes useTheme API
// To be placed in the user avatar dropdown menu (D-21)
'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Sun className="mr-2 size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute mr-2 size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        Giao dien
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="mr-2 size-4" />
          Sang
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 size-4" />
          Toi
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor className="mr-2 size-4" />
          He thong
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
```

### Complete File Migration Map

Current location -> Target location for all files that move:

**Components:**
| Current | Target |
|---------|--------|
| `components/auth/login-form.tsx` | `features/auth/components/login-form.tsx` |
| `components/auth/signup-form.tsx` | `features/auth/components/signup-form.tsx` |
| `components/auth/social-login-buttons.tsx` | `features/auth/components/social-login-buttons.tsx` |
| `components/post/post-card.tsx` | `features/post/components/post-card.tsx` |
| `components/post/post-carousel.tsx` | `features/post/components/post-carousel.tsx` |
| `components/post/post-actions.tsx` | `features/post/components/post-actions.tsx` |
| `components/post/post-detail-modal.tsx` | `features/post/components/post-detail-modal.tsx` |
| `components/post/post-menu.tsx` | `features/post/components/post-menu.tsx` |
| `components/post/caption-display.tsx` | `features/post/components/caption-display.tsx` |
| `components/feed/feed-list.tsx` | `features/feed/components/feed-list.tsx` |
| `components/feed/feed-skeleton.tsx` | `features/feed/components/feed-skeleton.tsx` |
| `components/feed/empty-feed.tsx` | `features/feed/components/empty-feed.tsx` |
| `components/reel/reel-feed.tsx` | `features/reel/components/reel-feed.tsx` |
| `components/reel/reel-card.tsx` | `features/reel/components/reel-card.tsx` |
| `components/reel/reel-actions.tsx` | `features/reel/components/reel-actions.tsx` |
| `components/reel/reel-author-info.tsx` | `features/reel/components/reel-author-info.tsx` |
| `components/reel/reel-comments-sheet.tsx` | `features/reel/components/reel-comments-sheet.tsx` |
| `components/reel/reel-skeleton.tsx` | `features/reel/components/reel-skeleton.tsx` |
| `components/reel/profile-reel-grid.tsx` | `features/reel/components/profile-reel-grid.tsx` |
| `components/reel/create-reel-flow.tsx` | `features/reel/components/create-reel-flow.tsx` |
| `components/profile/profile-header.tsx` | `features/profile/components/profile-header.tsx` |
| `components/profile/profile-post-grid.tsx` | `features/profile/components/profile-post-grid.tsx` |
| `components/profile/profile-skeleton.tsx` | `features/profile/components/profile-skeleton.tsx` |
| `components/profile/profile-edit-modal.tsx` | `features/profile/components/profile-edit-modal.tsx` |
| `components/profile/profile-stats.tsx` | `features/profile/components/profile-stats.tsx` |
| `components/profile/complete-profile-form.tsx` | `features/profile/components/complete-profile-form.tsx` |
| `components/social/follow-button.tsx` | `features/social/components/follow-button.tsx` |
| `components/social/follower-list.tsx` | `features/social/components/follower-list.tsx` |
| `components/social/user-row.tsx` | `features/social/components/user-row.tsx` |
| `components/collection/category-card.tsx` | `features/collection/components/category-card.tsx` |
| `components/collection/series-card.tsx` | `features/collection/components/series-card.tsx` |
| `components/collection/item-card.tsx` | `features/collection/components/item-card.tsx` |
| `components/collection/item-detail.tsx` | `features/collection/components/item-detail.tsx` |
| `components/collection/item-picker.tsx` | `features/collection/components/item-picker.tsx` |
| `components/collection/item-search.tsx` | `features/collection/components/item-search.tsx` |
| `components/collection/collection-showcase.tsx` | `features/collection/components/collection-showcase.tsx` |
| `components/collection/follow-series-button.tsx` | `features/collection/components/follow-series-button.tsx` |
| `components/collection/owned-wishlist-toggle.tsx` | `features/collection/components/owned-wishlist-toggle.tsx` |
| `components/checklist/checklist-card.tsx` | `features/checklist/components/checklist-card.tsx` |
| `components/checklist/checklist-entry.tsx` | `features/checklist/components/checklist-entry.tsx` |
| `components/checklist/checklist-form.tsx` | `features/checklist/components/checklist-form.tsx` |
| `components/comment/comment-list.tsx` | `features/comment/components/comment-list.tsx` |
| `components/comment/comment-item.tsx` | `features/comment/components/comment-item.tsx` |
| `components/comment/comment-input.tsx` | `features/comment/components/comment-input.tsx` |
| `components/create-post/create-post-flow.tsx` | `features/create-post/components/create-post-flow.tsx` |
| `components/create-post/image-cropper.tsx` | `features/create-post/components/image-cropper.tsx` |
| `components/create-post/step-caption.tsx` | `features/create-post/components/step-caption.tsx` |
| `components/create-post/step-edit.tsx` | `features/create-post/components/step-edit.tsx` |
| `components/create-post/step-gallery.tsx` | `features/create-post/components/step-gallery.tsx` |

**Hooks:**
| Current | Target |
|---------|--------|
| `hooks/queries/auth-queries.ts` | `features/auth/hooks/auth-queries.ts` |
| `hooks/queries/post-queries.ts` | `features/post/hooks/post-queries.ts` |
| `hooks/queries/reel-queries.ts` | `features/reel/hooks/reel-queries.ts` |
| `hooks/queries/profile-queries.ts` | `features/profile/hooks/profile-queries.ts` |
| `hooks/queries/social-queries.ts` | `features/social/hooks/social-queries.ts` |
| `hooks/queries/collection-queries.ts` | `features/collection/hooks/collection-queries.ts` |
| `hooks/queries/checklist-queries.ts` | `features/checklist/hooks/checklist-queries.ts` |
| `hooks/queries/comment-queries.ts` | `features/comment/hooks/comment-queries.ts` |
| `hooks/queries/interaction-queries.ts` | Split: like/bookmark -> `features/post/hooks/`, follow -> `features/social/hooks/` |

**Stores:**
| Current | Target |
|---------|--------|
| `stores/auth-store.ts` | `features/auth/stores/auth-store.ts` |
| `stores/create-post-store.ts` | `features/create-post/stores/create-post-store.ts` |
| `stores/create-reel-store.ts` | `features/reel/stores/create-reel-store.ts` |

**Files that stay:**
- `components/ui/*` -- shared shadcn/ui primitives
- `components/layout/*` -- shared layout (sidebar, bottom-nav, header-search, public-nav)
- `hooks/use-auth.ts` -- general auth init
- `hooks/use-toast.ts` -- general toast
- `lib/*` -- shared utilities

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` with `export function middleware()` | `proxy.ts` with `export function proxy()` | Next.js 16.0.0 (2025) | File and function must be renamed; old convention triggers deprecation warning |
| `cookies()` synchronous call | `await cookies()` async call | Next.js 15+ | Server-side cookie access must be awaited |
| `params` as plain object | `params` as `Promise` | Next.js 15+ | All dynamic route params must be `await`-ed (already handled in Phase 12) |
| `React.forwardRef` | Direct ref prop | React 19 | Already handled in Phase 12 |
| `useContext(ThemeContext)` | `useTheme()` from next-themes | next-themes 0.4+ | Abstracts away theme context internals |

**Deprecated/outdated:**
- `middleware.ts` convention: Deprecated in Next.js 16, renamed to `proxy.ts`. A codemod is available: `npx @next/codemod@canary middleware-to-proxy .`
- Synchronous `cookies()` / `headers()`: Must be awaited in Next.js 15+

## Open Questions

1. **JWT_SECRET Availability in Frontend Process**
   - What we know: Proxy needs JWT_SECRET to verify access tokens. Backend has it in its env.
   - What's unclear: Is the same secret available to the frontend Next.js process? In Docker, are env vars shared?
   - Recommendation: Check `docker-compose.yml` and `.env` for JWT_SECRET. If not available to frontend, add it. Do NOT use `NEXT_PUBLIC_` prefix (would expose to client). The proxy runs server-side, so a server-only env var works.

2. **`interaction-queries.ts` Splitting**
   - What we know: This file contains like, bookmark, and follow mutations spanning multiple domains.
   - What's unclear: Exact contents and import graph -- which components use which mutations.
   - Recommendation: Read the file during implementation, split by domain: like/bookmark -> post feature, follow -> social feature. Any truly cross-cutting utilities stay in a shared location.

3. **Backend CORS for Server-Side Fetch**
   - What we know: Client-side uses Axios with `withCredentials: true`. Server-side uses `fetch()` with Cookie header.
   - What's unclear: Will the backend accept requests from the server-side Next.js process (different origin than browser)?
   - Recommendation: Server-side fetch from localhost should work in development. In production, ensure CORS allows the frontend server origin or configure same-origin setup.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual verification + Next.js build |
| Config file | none -- frontend has no test framework configured |
| Quick run command | `cd frontend && pnpm build` |
| Full suite command | `cd frontend && pnpm build && pnpm start` (then manual check) |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FRNT-01 | Features/ directory structure with barrel exports | build | `cd frontend && pnpm build` | N/A |
| FRNT-02 | Proxy redirects unauthenticated users to /login | manual | Start dev server, clear cookies, visit / | N/A |
| FRNT-03 | Public pages have correct meta tags in page source | manual | `curl -s http://localhost:3000/post/xxx \| grep og:` | N/A |
| FRNT-04 | Dark mode toggles work and persist | manual | Toggle dark mode, refresh, verify persistence | N/A |

### Sampling Rate
- **Per task commit:** `cd frontend && pnpm build`
- **Per wave merge:** Full build + manual spot-check of auth redirect, SEO meta, dark mode
- **Phase gate:** Full build clean + all 4 manual checks pass

### Wave 0 Gaps
- No frontend test framework exists -- all validation is build-time (TypeScript errors) + manual
- `pnpm build` is the primary automated gate -- catches import errors, type errors, and missing exports

## Sources

### Primary (HIGH confidence)
- Next.js 16.2.1 official docs (nextjs.org/docs) -- proxy.ts convention, generateMetadata, Server Components, data fetching, cookies()
- Installed `node_modules/next` -- verified PROXY_FILENAME constant, middleware deprecation warning string
- Installed `package.json` -- verified next-themes@0.4.6 already in dependencies
- Installed `tailwind.config.ts` -- verified darkMode: ['class'] already configured
- Installed `globals.css` -- verified .dark CSS variables already defined

### Secondary (MEDIUM confidence)
- next-themes GitHub README -- ThemeProvider props, useTheme hook, suppressHydrationWarning requirement
- jose library -- Edge Runtime compatible JWT verification (well-established, used by Next.js Auth examples)

### Tertiary (LOW confidence)
- None -- all critical findings verified against installed packages or official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed, versions verified against npm registry
- Architecture: HIGH -- proxy.ts convention verified in installed Next.js 16 source code; Server Component patterns from official docs
- Pitfalls: HIGH -- FOUC prevention, cookie async, tailwind content paths are well-documented issues

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable -- all libraries at current versions, no breaking changes expected)
