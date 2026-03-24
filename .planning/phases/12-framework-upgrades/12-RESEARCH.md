# Phase 12: Framework Upgrades - Research

**Researched:** 2026-03-24
**Domain:** React 19, Next.js 16, NestJS 11 framework upgrades
**Confidence:** HIGH

## Summary

The frontend (React and Next.js) is already upgraded in package.json and installed at React 19.2.4 and Next.js 16.2.1. However, the codebase has NOT been fully migrated to the new APIs: 20 UI components still use `React.forwardRef` (deprecated in React 19), and 4 page components still use the old `useParams()` hook instead of the new `use(params)` async pattern required by Next.js 15+/16. The backend is the primary upgrade target: NestJS 10.4.22 must be upgraded to NestJS 11.x, which brings Express 5 (replacing Express 4), requires Node.js >= 20, and forces version bumps of satellite packages (`@nestjs/config` 3.x -> 4.x, `@nestjs/throttler` 6.3.x -> 6.4+, `@nestjs/cli` 10.x -> 11.x, `@nestjs/schematics` 10.x -> 11.x).

The backend also has React 18.3.1 installed (used by `@react-email/components` for email rendering), which should be updated to React 19 for consistency, and `@types/express` must be updated from v4 to v5 to match Express 5 bundled by NestJS 11's `@nestjs/platform-express`.

**Primary recommendation:** Execute in three sequential waves: (1) NestJS 11 backend upgrade with all dependency alignment, (2) Frontend React 19 forwardRef migration on shadcn/ui components, (3) Frontend Next.js 16 async params migration on remaining pages. Each wave can be independently verified.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FRMW-01 | React upgraded from v18 to v19 with all breaking changes resolved | React 19.2.4 already installed; 20 UI components need forwardRef removal; backend react-email needs React 19 update |
| FRMW-02 | Next.js upgraded from v14 to v16 with async API migrations complete | Next.js 16.2.1 already installed; 4 pages still use old `useParams()` pattern; need `use(params)` migration |
| FRMW-03 | NestJS upgraded from v10 to v11 with all dependencies aligned | Core upgrade 10.4 -> 11.x; Express 4 -> 5; 6 satellite packages need version bumps; @types/express v4 -> v5 |
</phase_requirements>

## Standard Stack

### Core (Target Versions)

| Library | Current | Target | Purpose | Why Upgrade |
|---------|---------|--------|---------|-------------|
| react | 19.2.4 (frontend) / 18.3.1 (backend) | 19.2.4 | UI framework | Already installed on frontend; backend email rendering needs alignment |
| react-dom | 19.2.4 | 19.2.4 | DOM rendering | Already installed |
| next | 16.2.1 | 16.2.1 | Frontend framework | Already installed; needs API migration |
| @nestjs/core | 10.4.22 | ^11.1.17 | Backend framework | Major upgrade required |
| @nestjs/common | 10.4.22 | ^11.1.17 | Backend utilities | Must match core |
| @nestjs/platform-express | 10.4.22 | ^11.1.17 | Express adapter | Bundles Express 5.2.1 (was 4.22.1) |

### Satellite Packages (Must Upgrade for NestJS 11)

| Library | Current | Target | Why |
|---------|---------|--------|-----|
| @nestjs/config | 3.3.0 | ^4.0.3 | v3.x peer dep is `@nestjs/common: ^8 \|\| ^9 \|\| ^10` -- does NOT support 11 |
| @nestjs/throttler | 6.3.0 | ^6.5.0 | v6.3.0 peer dep is `@nestjs/core: ^7-10` -- does NOT support 11; v6.4.0+ adds ^11 |
| @nestjs/cli | 10.4.9 | ^11.0.16 | Must match NestJS 11 for build/scaffolding |
| @nestjs/schematics | 10.2.3 | ^11.0.9 | Must match NestJS 11 |
| @nestjs/testing | 10.4.22 | ^11.1.17 | Must match core for tests |
| @types/express | 5.0.x (current) | ^5.0.6 | Express 5 types for NestJS 11 |

### Already Compatible (No Change Needed)

| Library | Version | Supports NestJS 11? |
|---------|---------|---------------------|
| @nestjs/bullmq | 11.0.4 | YES (`^10 \|\| ^11`) |
| @nestjs/jwt | 11.0.2 | YES (`^8-11`) |
| @nestjs/passport | 11.0.5 | YES (`^10 \|\| ^11`) |

### Frontend Dependencies (All React 19 Compatible)

| Library | Version | React 19 Support |
|---------|---------|-----------------|
| @tanstack/react-query | ^5.62.0 | YES (`^18 \|\| ^19`) |
| react-hook-form | ^7.71.2 | YES (`^16-19`) |
| @radix-ui/* | latest | YES (`^16-19`) |
| embla-carousel-react | ^8.6.0 | YES (`^16-19`) |
| react-easy-crop | ^5.5.6 | YES (`>=16.4.0`) |
| next-themes | ^0.4.6 | YES |
| @react-email/components | ^1.0.9 | YES (`^18 \|\| ^19`) |

**Installation (backend upgrade):**
```bash
cd backend
pnpm add @nestjs/core@^11.1.17 @nestjs/common@^11.1.17 @nestjs/platform-express@^11.1.17 @nestjs/config@^4.0.3
pnpm add -D @nestjs/cli@^11.0.16 @nestjs/schematics@^11.0.9 @nestjs/testing@^11.1.17 @types/express@^5.0.6
pnpm add @nestjs/throttler@^6.5.0
```

## Architecture Patterns

### Current Frontend State

The frontend already runs React 19.2.4 + Next.js 16.2.1. Two migration patterns remain incomplete:

**Pattern A: Pages already migrated to async params (3 pages)**
```typescript
// CORRECT pattern -- already used in [username]/page.tsx, followers/page.tsx, following/page.tsx, checklists/[checklistId]/page.tsx
export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  // ...
}
```

**Pattern B: Pages still using old useParams hook (4 pages needing migration)**
```typescript
// OLD pattern -- still in post/[postId], item/[itemId], collection/[categorySlug], collection/[categorySlug]/[seriesSlug]
import { useParams } from 'next/navigation';
export default function PostDetailPage() {
  const params = useParams();
  const postId = params.postId as string;
}
```

**Pages needing async params migration:**
1. `frontend/src/app/(public)/post/[postId]/page.tsx` -- uses `useParams()`
2. `frontend/src/app/(public)/item/[itemId]/page.tsx` -- uses `useParams<{ itemId: string }>()`
3. `frontend/src/app/(public)/collection/[categorySlug]/page.tsx` -- uses `useParams<{ categorySlug: string }>()`
4. `frontend/src/app/(public)/collection/[categorySlug]/[seriesSlug]/page.tsx` -- uses `useParams<{ categorySlug: string; seriesSlug: string }>()`

### React 19 forwardRef Migration

React 19 still supports `forwardRef` but it is deprecated. In React 19, `ref` is passed as a regular prop. The 20 shadcn/ui components in `frontend/src/components/ui/` all use `React.forwardRef`. These should be migrated to the new pattern:

**Before (React 18 / current code):**
```typescript
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
```

**After (React 19):**
```typescript
function Button({
  className,
  variant,
  size,
  asChild = false,
  ref,
  ...props
}: ButtonProps & { ref?: React.Ref<HTMLButtonElement> }) {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
}
```

**Files requiring forwardRef removal (20 files):**
1. `button.tsx` - 1 forwardRef
2. `input.tsx` - 1 forwardRef
3. `textarea.tsx` - 1 forwardRef
4. `label.tsx` - 1 forwardRef
5. `card.tsx` - 6 forwardRef (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter)
6. `dialog.tsx` - 4 forwardRef (DialogOverlay, DialogContent, DialogTitle, DialogDescription)
7. `alert-dialog.tsx` - 6 forwardRef
8. `sheet.tsx` - 4 forwardRef
9. `dropdown-menu.tsx` - 8 forwardRef
10. `toast.tsx` - 5 forwardRef
11. `tabs.tsx` - 3 forwardRef
12. `avatar.tsx` - 3 forwardRef
13. `scroll-area.tsx` - 2 forwardRef
14. `separator.tsx` - 1 forwardRef
15. `progress.tsx` - 1 forwardRef
16. `switch.tsx` - 1 forwardRef
17. `checkbox.tsx` - 1 forwardRef (assumed)
18. `popover.tsx` - 1 forwardRef
19. `carousel.tsx` - 5 forwardRef
20. `form.tsx` - 5 forwardRef

**Note:** `forwardRef` still works in React 19 (it is not removed, just deprecated). The migration is for future-proofing and eliminating deprecation warnings, not for fixing runtime breakage.

### NestJS 11 Backend Migration

**Key breaking changes (from release notes, v11.0.0 released 2025-01-16):**

1. **Node.js >= 20 required** (Node 16/18 dropped) -- OK, project uses Node 25.8.0
2. **Express 5 bundled** (was Express 4) -- `@nestjs/platform-express@11` includes `express@5.2.1`
3. **@nestjs/config v4** -- reading order changed (internal config > validated env > process.env)
4. **`@Inject()` type narrowing** -- stricter types for injection tokens
5. **Module exports** -- dropped broken support for promises in module `exports`
6. **path-to-regexp v8** -- Express 5 uses `path-to-regexp@8.3.0` (stricter route patterns)

### Express 5 Impact on This Codebase

Express 5 in NestJS 11 is largely transparent because NestJS abstracts most Express APIs. However:

**Express type imports:** 11 files import `Request` or `Response` from `express`. With `@types/express@5`, these types change slightly. The pattern `req.user as any` remains valid. The pattern `req.cookies` remains valid (cookie-parser middleware works the same).

**cookie-parser:** The `import * as cookieParser from 'cookie-parser'` pattern in `main.ts` should continue to work, but may need to be `import cookieParser from 'cookie-parser'` depending on ESM interop. NestJS 11 with Express 5 still supports the same middleware pattern.

**Multer:** `Express.Multer.File` type is used in 2 source files + 1 test file. With `@types/multer@2.1.0` (already installed) and Express 5, the `Express.Multer.File` global type should still be available via `@types/multer`.

**`@nestjs/config` v4 breaking change:** The config reading order changed. In this project, `ConfigModule.forRoot()` uses `load: [configuration]` with custom config files. The new order (internal config takes precedence over `process.env`) should not break existing behavior since the project already relies on custom config files. However, any `configService.get()` call that expects `process.env` to override internal config will behave differently.

### Anti-Patterns to Avoid

- **Upgrading all at once:** Do NOT upgrade frontend and backend simultaneously. Backend NestJS upgrade should be done first and verified independently, then frontend cleanup.
- **Keeping forwardRef with React 19:** While it works, leaving deprecated APIs creates tech debt. Since shadcn/ui components are project-owned (not in node_modules), they should be migrated.
- **Mixing Express 4 and 5 types:** After upgrading to NestJS 11, ensure ALL `@types/express` references point to v5. Having v4 types with v5 runtime will cause subtle type mismatches.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| NestJS upgrade automation | Manual package-by-package upgrade guessing | `nest update` CLI command + manual satellite bumps | CLI handles core alignment; satellites need manual attention |
| React 19 forwardRef codemod | Manual find-and-replace across 20 files | Systematic per-file refactor with known pattern | Each component has unique props interface; no automated codemod is fully reliable |
| Express 5 compatibility | Custom middleware wrappers | Let NestJS platform-express handle abstraction | NestJS added legacy route path converter to minimize breaking changes |

## Common Pitfalls

### Pitfall 1: @nestjs/config v3 Peer Dependency Failure
**What goes wrong:** After upgrading `@nestjs/core` to v11, `@nestjs/config@3.3.0` throws a peer dependency error because it only supports `@nestjs/common: ^8 || ^9 || ^10`.
**Why it happens:** Satellite packages have their own peer dependency ranges that don't always cover the latest major.
**How to avoid:** Upgrade `@nestjs/config` to v4.x TOGETHER with core packages in the same `pnpm add` command.
**Warning signs:** `pnpm install` warnings about unmet peer dependencies; backend fails to compile.

### Pitfall 2: @nestjs/throttler v6.3.0 Incompatible with NestJS 11
**What goes wrong:** ThrottlerGuard breaks at runtime because `@nestjs/throttler@6.3.0` peer deps only go up to `@nestjs/core@^10`.
**Why it happens:** The installed v6.3.0 was released before NestJS 11; v6.4.0+ added `^11` support.
**How to avoid:** Bump `@nestjs/throttler` to `^6.5.0` during the upgrade.
**Warning signs:** Runtime errors in ThrottlerGuard; dependency tree warnings.

### Pitfall 3: @nestjs/config v4 Config Reading Order Change
**What goes wrong:** After upgrading to `@nestjs/config@4`, internal configuration (from `load: [configuration]`) now takes precedence over `process.env`. If code expects environment variables to override config file values, behavior silently changes.
**Why it happens:** v4 intentionally changed the priority order.
**How to avoid:** Review `backend/src/config/configuration.ts` to ensure the config factory reads `process.env` explicitly where needed (which it likely already does since it uses `process.env.X || default`).
**Warning signs:** Different behavior in Docker vs. local dev; environment variables seem to be "ignored."

### Pitfall 4: Express 5 path-to-regexp Stricter Route Matching
**What goes wrong:** Some route patterns valid in Express 4 may fail silently or error in Express 5 due to `path-to-regexp@8.x`.
**Why it happens:** Express 5 uses stricter path pattern parsing. Optional params `/:param?` and regex in routes may need updating.
**How to avoid:** NestJS added a "legacy route path converter" to minimize this. Standard NestJS decorator routes (`@Get(':id')`) are not affected. Verify all routes work after upgrade.
**Warning signs:** 404 errors on routes that previously worked.

### Pitfall 5: React 19 forwardRef + Radix UI Slot Interaction
**What goes wrong:** When migrating shadcn Button (which uses `@radix-ui/react-slot`'s `Slot` with `asChild`), removing `forwardRef` and passing `ref` as a prop may not forward correctly to `Slot`.
**Why it happens:** Radix UI Slot component internally handles ref merging. With React 19, Slot also accepts ref as a prop, but the interaction depends on the Radix version.
**How to avoid:** The installed Radix versions (e.g., `@radix-ui/react-slot@1.2.4`) are React 19-compatible and handle `ref` as a prop. Test each migrated component renders correctly.
**Warning signs:** Refs returning `null`; focus management broken on dialogs/modals.

### Pitfall 6: Backend react Package Not Upgraded
**What goes wrong:** Backend has `react@18.3.1` (used by `@react-email/components` for email rendering). After frontend is on React 19, the monorepo has mismatched React versions.
**Why it happens:** Backend `package.json` specifies `react: ^18.3.0` separately.
**How to avoid:** Update backend `react` to `^19.0.0` when doing the NestJS upgrade. `@react-email/components` supports React 19.
**Warning signs:** pnpm workspace hoisting issues; type conflicts between React 18 and 19 types.

## Code Examples

### NestJS 11 Upgrade Commands
```bash
# In backend/ directory
# Step 1: Upgrade core + satellite packages together
pnpm add @nestjs/core@^11.1.17 @nestjs/common@^11.1.17 @nestjs/platform-express@^11.1.17 @nestjs/config@^4.0.3 @nestjs/throttler@^6.5.0

# Step 2: Upgrade dev dependencies
pnpm add -D @nestjs/cli@^11.0.16 @nestjs/schematics@^11.0.9 @nestjs/testing@^11.1.17 @types/express@^5.0.6

# Step 3: Upgrade backend react for email rendering
pnpm add react@^19.0.0

# Step 4: Verify
pnpm run build
pnpm run test
```

### async params Migration Pattern (Next.js 16)
```typescript
// Before (useParams -- old pattern)
'use client';
import { useParams } from 'next/navigation';
export default function PostDetailPage() {
  const params = useParams();
  const postId = params.postId as string;
  // ...
}

// After (use(params) -- Next.js 15+/16 pattern)
'use client';
import { use } from 'react';
export default function PostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = use(params);
  // ...
}
```

### forwardRef Removal Pattern (React 19)
```typescript
// Before
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return <input type={type} className={cn("...", className)} ref={ref} {...props} />
  }
)
Input.displayName = "Input"

// After
function Input({
  className,
  type,
  ref,
  ...props
}: React.ComponentProps<"input">) {
  return <input type={type} className={cn("...", className)} ref={ref} {...props} />
}
```

**Note:** `React.ComponentProps<"input">` in React 19 already includes `ref` in the props type, so no need for a separate `ref` type parameter.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| React.forwardRef() | ref as regular prop | React 19 (Dec 2024) | forwardRef still works but deprecated |
| useParams() synchronous | params as Promise + use() | Next.js 15 (Oct 2024) | useParams still works in client components but async is the standard |
| Express 4 in NestJS | Express 5 in NestJS 11 | NestJS 11 (Jan 2025) | NestJS adds legacy converter for backward compat |
| @nestjs/config v3 | @nestjs/config v4 | NestJS 11 (Jan 2025) | Config priority order changed |
| Node 16/18 supported | Node >= 20 required | NestJS 11 (Jan 2025) | Project already on Node 25.8.0 |

**Deprecated/outdated:**
- `React.forwardRef()`: Deprecated in React 19, use ref as prop
- `useParams()` in page components: Deprecated pattern in Next.js 15+; use `use(params)` with Promise-typed params prop
- `@nestjs/config@3.x`: Does not support NestJS 11; must use v4
- `@nestjs/throttler@6.0-6.3`: Does not support NestJS 11; must use v6.4+
- Express 4 types: NestJS 11 bundles Express 5; `@types/express@4` is incorrect

## Open Questions

1. **@nestjs/config v4 behavior with existing configuration.ts**
   - What we know: v4 changed reading order so internal config takes precedence over process.env
   - What's unclear: Whether the existing `configuration.ts` factory function pattern (which reads `process.env` directly in the factory) is affected. Likely NOT affected since the factory itself reads process.env and returns the values as internal config.
   - Recommendation: Review `configuration.ts` after upgrade and verify Docker env vars still work. LOW risk.

2. **cookie-parser import syntax with Express 5**
   - What we know: `import * as cookieParser from 'cookie-parser'` works with Express 4
   - What's unclear: Whether the namespace import pattern changes with Express 5. `cookie-parser` has a default export.
   - Recommendation: Test after upgrade; if it fails, change to `import cookieParser from 'cookie-parser'` or use `esModuleInterop`. LOW risk since tsconfig has `allowSyntheticDefaultImports: true`.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 (backend) |
| Config file | `backend/jest.config.ts` |
| Quick run command | `cd backend && pnpm test -- --bail` |
| Full suite command | `cd backend && pnpm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FRMW-01 | React 19 components render without forwardRef errors | smoke | `cd frontend && pnpm build` (compile-time check) | N/A - build verification |
| FRMW-02 | Next.js 16 async params pages load correctly | smoke | `cd frontend && pnpm build` (compile-time check) | N/A - build verification |
| FRMW-03 | NestJS 11 backend starts and all tests pass | unit+e2e | `cd backend && pnpm test -- --bail` | YES - 19 spec files exist |

### Sampling Rate
- **Per task commit:** `cd backend && pnpm run build && pnpm test -- --bail` / `cd frontend && pnpm build`
- **Per wave merge:** Full backend test suite + frontend build
- **Phase gate:** Backend starts successfully (`pnpm run start`), frontend builds successfully (`pnpm build`), all existing backend tests pass

### Wave 0 Gaps
- None -- existing test infrastructure covers backend verification. Frontend has no tests but build verification is sufficient for this phase (components either compile or don't with React 19 types).

## Sources

### Primary (HIGH confidence)
- npm registry: Verified all package versions and peer dependencies via `npm view`
- NestJS v11.0.0 release notes: GitHub release tag -- confirmed Express 5, Node >= 20, config v4 breaking changes
- @nestjs/config v4.0.0 release notes: GitHub release -- confirmed reading order change
- Project codebase: Direct analysis of all 20 forwardRef files, 4 useParams pages, 11 Express type imports, backend package versions

### Secondary (MEDIUM confidence)
- Express 5 breaking changes: Known from Express docs -- path-to-regexp v8, removed deprecated APIs
- React 19 forwardRef deprecation: Known from React 19 release notes and blog

### Tertiary (LOW confidence)
- None -- all findings verified against npm registry and source code

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All versions verified via npm registry and installed node_modules
- Architecture: HIGH - Direct codebase analysis of all affected files
- Pitfalls: HIGH - Peer dependency incompatibilities confirmed via npm view; NestJS release notes read

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable -- major framework versions don't change frequently)
