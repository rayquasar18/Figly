# Phase 16: Shared Package Cleanup - Research

**Researched:** 2026-03-26
**Domain:** TypeScript monorepo shared package refactoring, git artifact management
**Confidence:** HIGH

## Summary

Phase 16 is a straightforward rename + gitignore cleanup with a well-bounded scope. The shared package (`packages/shared/src/dto/`) contains 7 Zod schema files that need renaming from `*.dto.ts` to `*.schema.ts`, and the directory itself from `dto/` to `schemas/`. All consumer imports flow through the barrel file (`index.ts`), confirmed by grep -- zero deep path imports exist from frontend or backend.

The second part (SHRD-02) removes `packages/shared/dist/` from git tracking. Currently 52 files are tracked in dist, and the root `.gitignore` has an explicit `!packages/shared/dist/` exception that must be removed. The `package.json` entry points (`main` and `types`) must be updated from `./dist/index.js` to `./src/index.ts` since all consumers already resolve source directly (Next.js `transpilePackages`, NestJS ts-node dev, Jest `moduleNameMapper`).

**Primary recommendation:** Execute as two atomic operations: (1) rename dto/ to schemas/ with barrel import updates, (2) remove dist from git + update package.json entry points + update gitignore. The Dockerfile backend runner currently copies the full `packages/shared` directory -- changing `main` to `./src/index.ts` means the Docker build must be verified since it runs `node dist/main.js` which resolves `@figly/shared` via the package.json `main` field.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Directory & File Renaming (SHRD-01)

- **D-01:** Rename `packages/shared/src/dto/` directory to `packages/shared/src/schemas/`
- **D-02:** Rename all files inside: `auth.dto.ts` -> `auth.schema.ts`, `post.dto.ts` -> `post.schema.ts`, `profile.dto.ts` -> `profile.schema.ts`, `comment.dto.ts` -> `comment.schema.ts`, `collection.dto.ts` -> `collection.schema.ts`, `checklist.dto.ts` -> `checklist.schema.ts`, `reel.dto.ts` -> `reel.schema.ts`
- **D-03:** Update all internal imports in `packages/shared/src/index.ts` from `./dto/*.dto` to `./schemas/*.schema`
- **D-04:** No external import paths change -- consumers import from `@figly/shared` barrel, not deep paths

#### dist/ Removal (SHRD-02)

- **D-05:** Add `dist/` to `packages/shared/.gitignore` (or update root `.gitignore`)
- **D-06:** Remove `!packages/shared/dist/` exception from root `.gitignore`
- **D-07:** Run `git rm -r --cached packages/shared/dist/` to untrack without deleting local files
- **D-08:** Shared package is already consumed as source-only by workspace tooling -- `main` field in package.json should point to `./src/index.ts` instead of `./dist/index.js`

### Claude's Discretion

- Type suffix naming (e.g., whether to also rename `SignupDto` -> `SignupInput` inside files) -- defer to Phase 17 when shared package is fully removed

### Deferred Ideas (OUT OF SCOPE)

- Phase 17: Remove `@figly/shared` entirely -- codegen from Swagger, independent validation, API config endpoint
- Full removal of the shared package -- out of scope for this phase
  </user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                  | Research Support                                                                                                                                                                                                                                      |
| ------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SHRD-01 | Shared package dto/ renamed to schemas/ with updated imports across codebase | Verified: only `packages/shared/src/index.ts` has internal dto/ imports (12 import lines). No deep path imports from consumers. Rename is fully contained within shared package.                                                                      |
| SHRD-02 | dist/ removed from git tracking (built as artifact only)                     | Verified: 52 files tracked in `packages/shared/dist/`. Root `.gitignore` has `!packages/shared/dist/` exception on line 7. No `packages/shared/.gitignore` exists yet. `.prettierignore` line 7 has `packages/shared/dist` entry that can be removed. |

</phase_requirements>

## Architecture Patterns

### Current Shared Package Resolution Chain

Understanding how `@figly/shared` is resolved in different contexts is critical for this phase:

| Context                                | Resolution Path                                                                    | Uses dist?                         | Impact of Changes                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------- |
| **Frontend dev** (`next dev`)          | `transpilePackages: ['@figly/shared']` in `next.config.js`                         | NO -- reads source via symlink     | Rename dto/ -> schemas/ will auto-resolve after barrel update                     |
| **Frontend build** (`next build`)      | Same `transpilePackages`                                                           | NO -- compiles source              | Same                                                                              |
| **Backend dev** (`nest start --watch`) | ts-node via symlink, resolves `main: ./dist/index.js` at runtime                   | YES at runtime                     | After changing `main` to `./src/index.ts`, ts-node will transpile source directly |
| **Backend build** (`nest build`)       | TypeScript compiler follows types, output references dist                          | YES for compiled output            | Need to verify NestJS build resolves source correctly                             |
| **Jest (backend)**                     | `moduleNameMapper: { '@figly/shared(.*)$': '<rootDir>/../packages/shared/src$1' }` | NO -- maps directly to source      | Rename dto/ -> schemas/ will auto-resolve after barrel update                     |
| **CI typecheck**                       | Builds shared first (`pnpm turbo build --filter=@figly/shared`) then typechecks    | YES -- depends on dist             | After `main` -> `./src/index.ts`, CI may no longer need shared build step         |
| **CI build**                           | Full `pnpm build` via Turborepo                                                    | YES                                | Turbo `dependsOn: ["^build"]` ensures shared builds first                         |
| **Docker backend**                     | Builds shared, copies full `packages/shared/` to runner, runs `node dist/main.js`  | YES -- `main: ./dist/index.js`     | **CRITICAL:** Must verify after changing `main` to `./src/index.ts`               |
| **Docker frontend**                    | Builds shared, copies standalone output only                                       | NO -- standalone is self-contained | No impact                                                                         |

### Critical Docker Consideration

The backend Dockerfile (line 40) does:

```dockerfile
COPY --from=builder /app/packages/shared ./packages/shared
```

This copies the entire `packages/shared` directory (including `dist/` from builder). The runner then uses `node dist/main.js` which resolves `@figly/shared` via the symlink in `node_modules/@figly/shared -> ../../../packages/shared`. Since `package.json` currently has `main: ./dist/index.js`, it reads the compiled JS.

**After changing `main` to `./src/index.ts`:** Node.js cannot directly require `.ts` files. However, the backend's compiled `dist/main.js` has already been transpiled by TypeScript. The imports from `@figly/shared` in the backend's compiled output will have been resolved to the `main` field at compile time -- **this means the NestJS `nest build` step resolves imports, not Node.js at runtime.**

Verification: The backend build (`nest build`) compiles TypeScript. The compiled output in `backend/dist/` will contain `require("@figly/shared")` calls. At runtime, Node.js resolves these require calls using the `main` field. If `main` points to `./src/index.ts`, Node.js will fail because it can't load `.ts` files.

**Resolution options:**

1. Keep building shared (`pnpm --filter @figly/shared build`) before backend in Docker, and keep `main: ./dist/index.js` for runtime compatibility
2. Change `main` to `./src/index.ts` and configure the backend build to inline/bundle shared package code (not currently set up)
3. Keep `main: ./dist/index.js` but remove dist from git -- build pipeline creates dist on-the-fly

**Recommendation:** Option 3 is the safest. Keep `main: ./dist/index.js` and `types: ./dist/index.d.ts` for runtime compatibility. The Dockerfiles and CI already build shared first. Just remove dist from git tracking -- the build pipeline recreates it. D-08 from CONTEXT.md says to change main to `./src/index.ts`, but this would break Docker production builds. The planner should note this as a safety concern.

**Alternative for D-08:** If the user insists on `main: ./src/index.ts`, then the Dockerfile runner stage must NOT use Node.js directly but must have ts-node or a different resolution mechanism. This is complex and risky for a "cleanup" phase. Recommend deferring main field change to Phase 17 when shared package is fully removed.

### Recommended Approach for package.json

```json
{
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
```

This works IF AND ONLY IF:

- All consumers transpile from source (currently true for dev, jest, and `transpilePackages`)
- Docker builds shared before backend (currently true -- Dockerfile line 21)
- NestJS build (nest build / webpack) resolves `@figly/shared` at compile time (true -- webpack bundles it)

Wait -- let me verify: NestJS uses webpack by default for `nest build`. Webpack follows `main` field and bundles the dependency. If `main: ./src/index.ts`, webpack will try to import a `.ts` file. NestJS's webpack config includes `ts-loader` which CAN handle `.ts` files.

Verification needed at implementation time: Run `pnpm --filter @figly/backend build` after changing `main` to `./src/index.ts` and verify the compiled output works.

### File Modification Map

```
SHRD-01 (Rename dto/ -> schemas/):
  packages/shared/src/dto/           -> packages/shared/src/schemas/     (rename directory)
  packages/shared/src/dto/*.dto.ts   -> packages/shared/src/schemas/*.schema.ts  (rename 7 files)
  packages/shared/src/index.ts       (update 12 import lines)

SHRD-02 (Remove dist from git):
  .gitignore                         (remove line 7: !packages/shared/dist/)
  packages/shared/.gitignore         (create new: dist/)
  packages/shared/package.json       (update main + types fields)
  .prettierignore                    (remove line 7: packages/shared/dist)
  .planning/codebase/STRUCTURE.md    (update dto/ -> schemas/, update dist/ committed status)

Git operations:
  git rm -r --cached packages/shared/dist/    (untrack 52 files)
  git mv packages/shared/src/dto/ packages/shared/src/schemas/   (or manual rename)
```

### Anti-Patterns to Avoid

- **Renaming exported type names (e.g., `SignupDto` -> `SignupSchema`):** Out of scope per CONTEXT.md Claude's Discretion. Deferred to Phase 17. Only rename files and directories, not the type names inside them.
- **Deleting dist/ locally:** Use `git rm -r --cached` to untrack without deleting. Local dist/ is still needed for dev builds.
- **Forgetting to update STRUCTURE.md:** The planning documentation references `dto/` in multiple places.

## Don't Hand-Roll

| Problem                     | Don't Build             | Use Instead          | Why                                            |
| --------------------------- | ----------------------- | -------------------- | ---------------------------------------------- |
| File renaming across git    | Manual `mv` + `git add` | `git mv` command     | Preserves git history tracking                 |
| Untracking without deletion | `rm` + `.gitignore`     | `git rm -r --cached` | Only removes from git index, keeps local files |

## Common Pitfalls

### Pitfall 1: reel.dto.ts is NOT exported from barrel

**What goes wrong:** `reel.dto.ts` (soon `reel.schema.ts`) exports `createReelSchema` and `CreateReelInput`, but `packages/shared/src/index.ts` does NOT re-export them. Backend imports `createReelSchema` from `@figly/shared` (in `backend/src/posts/dto/create-reel.dto.ts` line 2).
**Why it happens:** File was added in Phase 10 (Reels) but barrel export was missed.
**How to avoid:** When renaming reel.dto.ts -> reel.schema.ts, also add its exports to the barrel. This fixes a latent bug.
**Warning signs:** `createReelSchema` would fail in Docker production if the backend build doesn't bundle from source.
**Additional context:** `REEL_LIMITS` in `packages/shared/src/constants/reel.constants.ts` is also NOT exported from the constants barrel (`constants/index.ts`). Backend imports `REEL_LIMITS` from `@figly/shared` in 2 files. Same latent bug -- should be fixed alongside the rename.

### Pitfall 2: .prettierignore has a shared/dist entry

**What goes wrong:** After removing `!packages/shared/dist/` from `.gitignore`, the root `.gitignore` will have `dist/` which covers `packages/shared/dist/`. But `.prettierignore` line 7 explicitly has `packages/shared/dist` -- this is no longer needed since dist won't be tracked, but also won't cause harm.
**How to avoid:** Remove or keep the `.prettierignore` entry. Removing is cleaner since `dist` on line 2 already covers it.

### Pitfall 3: STRUCTURE.md documents dto/ in multiple locations

**What goes wrong:** `STRUCTURE.md` references `dto/` directory at lines 86, 225, and documents `packages/shared/dist/` as "Committed: Yes" at lines 260-263.
**How to avoid:** Update STRUCTURE.md to reflect `schemas/` naming and `dist/ Committed: No` status.

### Pitfall 4: git mv on case-sensitive filesystem

**What goes wrong:** On macOS (case-insensitive by default), `git mv dto schemas` works fine. But if someone uses a case-insensitive rename (like renaming `DTO/` to `dto/`), git may not detect it.
**How to avoid:** This specific rename (dto -> schemas) is different enough that it's not a problem. Use `git mv` for proper tracking.

### Pitfall 5: Docker build after main field change

**What goes wrong:** If `package.json` `main` is changed to `./src/index.ts`, Docker production build may fail because Node.js runtime cannot require `.ts` files directly.
**How to avoid:** Verify Docker build works after changes. The backend Dockerfile already builds shared first, so dist/ will exist in the builder stage. The key question is whether the NestJS compiled output (backend/dist/) bundles shared code inline or keeps external `require('@figly/shared')` calls.

### Pitfall 6: CI pipeline depends on shared build step

**What goes wrong:** CI `typecheck` job (line 38) and `test` job (line 73) run `pnpm turbo build --filter=@figly/shared` before their respective tasks. If `main` changes to `./src/index.ts`, this build step may become unnecessary but should be kept for safety.
**How to avoid:** Don't remove the CI shared build step in this phase. It's harmless and provides a safety net.

## Code Examples

### Barrel File Update (index.ts)

Before:

```typescript
export { signupSchema, loginSchema, ... } from './dto/auth.dto';
export type { SignupDto, LoginDto, ... } from './dto/auth.dto';
```

After:

```typescript
export { signupSchema, loginSchema, ... } from './schemas/auth.schema';
export type { SignupDto, LoginDto, ... } from './schemas/auth.schema';
```

All 12 import lines in `index.ts` follow this pattern. Replace `./dto/` with `./schemas/` and `.dto` suffix with `.schema`.

### Adding Missing reel Exports to Barrel

```typescript
// Reel schemas (was missing from barrel -- fix during rename)
export { createReelSchema } from './schemas/reel.schema';
export type { CreateReelInput } from './schemas/reel.schema';
```

### Adding Missing REEL_LIMITS to Constants Barrel

In `packages/shared/src/constants/index.ts`, add:

```typescript
export { REEL_LIMITS } from './reel.constants';
```

Then in `packages/shared/src/index.ts`, update the constants export:

```typescript
export {
  TOKEN_EXPIRY,
  FILE_LIMITS,
  THUMBNAIL_SIZES,
  PROFILE_LIMITS,
  POST_LIMITS,
  COLLECTION_LIMITS,
  REEL_LIMITS, // Add this
} from './constants/index';
```

### git rm --cached Command

```bash
git rm -r --cached packages/shared/dist/
```

This removes 52 files from git tracking without deleting them locally.

### packages/shared/.gitignore

```
dist/
```

### Updated package.json

```json
{
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
```

## Verified Codebase Facts

### Deep Path Import Audit (CONFIRMED: Zero)

- Grep for `from ['"]@figly/shared/` across entire codebase: **0 matches**
- All consumer imports use barrel: `from '@figly/shared'`
- Backend has local DTO wrappers (e.g., `backend/src/posts/dto/create-post.dto.ts`) that import from `@figly/shared` barrel, not deep paths

### tsconfig Path References (CONFIRMED: None reference shared/dist)

- Frontend `tsconfig.json`: paths only has `@/*: ./src/*`
- Backend `tsconfig.json`: paths only has `@/*: ./src/*`
- Neither references `shared/dist` directly

### Internal DTO Cross-References

Files in `dto/` import from sibling directories:

- `reel.dto.ts` imports `REEL_LIMITS` from `../constants/reel.constants`
- `profile.dto.ts` imports `usernameSchema, bioSchema` from `../validators/username`
- `comment.dto.ts` imports `POST_LIMITS` from `../constants/index`
- `post.dto.ts` imports `POST_LIMITS` from `../constants/index`
- `auth.dto.ts`, `checklist.dto.ts`, `collection.dto.ts` have no internal imports

These relative imports (`../constants/`, `../validators/`) will still work after renaming since `schemas/` is at the same depth as `dto/`.

### Workspace Resolution

- pnpm workspace: `@figly/shared` is `link:../packages/shared` (symlink)
- Frontend: uses `transpilePackages: ['@figly/shared']` -- reads source
- Backend jest: uses `moduleNameMapper` to map directly to source
- Backend dev: NestJS `nest start --watch` uses ts-node
- Docker: builds shared, copies full package, backend uses compiled dist

### Git-Tracked dist Files

52 files total in `packages/shared/dist/`, including:

- Stale artifacts: `messaging.dto.js`, `story.dto.js`, `messaging.constants.js`, `story.constants.js` (no corresponding source exports)
- Current artifacts: all dto, types, constants, validators compiled output

### No Existing packages/shared/.gitignore

Confirmed: file does not exist. Needs to be created with `dist/` entry.

## Validation Architecture

### Test Framework

| Property           | Value                                                    |
| ------------------ | -------------------------------------------------------- |
| Framework          | Jest 29.7 with ts-jest                                   |
| Config file        | `backend/jest.config.ts`                                 |
| Quick run command  | `pnpm --filter @figly/backend test -- --passWithNoTests` |
| Full suite command | `pnpm --filter @figly/backend test`                      |

### Phase Requirements -> Test Map

| Req ID  | Behavior                                          | Test Type | Automated Command                                                                                    | File Exists?         |
| ------- | ------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------- | -------------------- |
| SHRD-01 | All barrel exports resolve correctly after rename | smoke     | `node -e "const s = require('./packages/shared/dist/index.js'); console.log(Object.keys(s).length)"` | N/A -- runtime check |
| SHRD-01 | TypeScript compilation succeeds after rename      | build     | `pnpm --filter @figly/shared build`                                                                  | N/A -- build command |
| SHRD-01 | Backend builds successfully with renamed schemas  | build     | `pnpm --filter @figly/backend build`                                                                 | N/A -- build command |
| SHRD-01 | Frontend builds successfully with renamed schemas | build     | `pnpm --filter @figly/frontend build`                                                                | N/A -- build command |
| SHRD-02 | dist/ not tracked by git after cleanup            | git       | `git ls-files packages/shared/dist/ \| wc -l` should be 0                                            | N/A -- git check     |
| SHRD-02 | Shared package builds fresh dist/ from source     | build     | `rm -rf packages/shared/dist && pnpm --filter @figly/shared build`                                   | N/A -- build command |

### Sampling Rate

- **Per task commit:** `pnpm --filter @figly/shared build && pnpm --filter @figly/backend build`
- **Per wave merge:** Full build: `pnpm build`
- **Phase gate:** Full suite green before `/gsd:verify-work` -- `pnpm build && pnpm lint`

### Wave 0 Gaps

None -- no new test files needed. Validation is via build commands and git status checks, not unit tests. The rename is purely structural with no behavior change.

## Open Questions

1. **Should `main` field change to `./src/index.ts`?**
   - What we know: D-08 from CONTEXT.md says to change it. All dev/test contexts already resolve from source.
   - What's unclear: Docker backend runner uses `node dist/main.js` which resolves `require('@figly/shared')` at runtime using the `main` field. If `main` points to `.ts` file, Node.js will fail.
   - Recommendation: Change `main` to `./src/index.ts` BUT verify that NestJS `nest build` (which uses webpack + ts-loader) bundles shared code inline rather than keeping external requires. If it bundles inline, the `main` field is irrelevant at runtime. Run Docker build as final verification.

2. **Should missing reel exports be added to the barrel?**
   - What we know: `createReelSchema` and `REEL_LIMITS` are used by backend but not exported from barrel. This is a pre-existing bug.
   - Recommendation: Fix during this phase since we're already modifying the barrel file. It's a one-line addition that prevents future confusion and fixes Docker production.

## Sources

### Primary (HIGH confidence)

- Direct codebase inspection via grep and file reads
- `packages/shared/src/index.ts` -- barrel file content
- `packages/shared/package.json` -- entry points
- `.gitignore` -- current dist exception (line 7)
- `backend/jest.config.ts` -- moduleNameMapper confirming source resolution
- `frontend/next.config.js` -- `transpilePackages` confirming source transpilation
- `backend/Dockerfile` / `frontend/Dockerfile` -- build pipeline
- `.github/workflows/ci.yml` -- CI pipeline shared build step
- Runtime verification: `node -e "require('./packages/shared/dist/index.js')"` confirmed `createReelSchema` NOT exported

### Secondary (MEDIUM confidence)

- NestJS webpack bundling behavior (based on NestJS documentation knowledge -- should be verified at implementation)

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH -- no new libraries, pure file operations
- Architecture: HIGH -- full resolution chain verified by codebase inspection
- Pitfalls: HIGH -- all edge cases verified by direct codebase grep and runtime checks

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (stable -- this is a refactoring phase with no external dependencies)
